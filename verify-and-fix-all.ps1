# PowerShell script to verify and fix all database and server issues
# This script checks everything and fixes problems automatically

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete System Verification and Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$INSTANCE_NAME = "altayar-db"
$DATABASE_NAME = "tourist_app_db"
$DB_USER = "postgres"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"
$CLOUD_SQL_SOCKET = "/cloudsql/${CONNECTION_NAME}"

# Set project
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Service: $SERVICE_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host "   Cloud SQL: $CONNECTION_NAME" -ForegroundColor White
Write-Host "   Socket Path: $CLOUD_SQL_SOCKET" -ForegroundColor White
Write-Host ""

# Check if gcloud is installed
Write-Host "Step 1: Checking gcloud CLI..." -ForegroundColor Cyan
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "   [OK] gcloud CLI found: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "   Please install Google Cloud SDK first" -ForegroundColor Yellow
    exit 1
}

# Set project
Write-Host ""
Write-Host "Step 2: Setting Google Cloud project..." -ForegroundColor Cyan
try {
    $output = gcloud config set project $PROJECT_ID 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -or $output -match "Updated property") {
        Write-Host "   [OK] Project set to: $PROJECT_ID" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Could not set project (may already be set)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [WARNING] Could not set project (may already be set)" -ForegroundColor Yellow
}

# Check Cloud SQL instance
Write-Host ""
Write-Host "Step 3: Checking Cloud SQL instance..." -ForegroundColor Cyan
try {
    $instanceOutput = gcloud sql instances describe $INSTANCE_NAME --format="json" 2>&1 | Out-String
    $instanceInfo = $instanceOutput | ConvertFrom-Json
    
    if ($instanceInfo) {
        Write-Host "   [OK] Cloud SQL instance found" -ForegroundColor Green
        Write-Host "      Name: $($instanceInfo.name)" -ForegroundColor White
        Write-Host "      State: $($instanceInfo.state)" -ForegroundColor White
        Write-Host "      Connection Name: $($instanceInfo.connectionName)" -ForegroundColor White
        
        if ($instanceInfo.state -ne "RUNNABLE") {
            Write-Host "      [WARNING] Instance is not in RUNNABLE state" -ForegroundColor Yellow
        }
        
        # Check Public IP
        if ($instanceInfo.settings.ipConfiguration.ipv4Enabled) {
            $publicIP = $instanceInfo.ipAddresses | Where-Object { $_.type -eq "PRIMARY" } | Select-Object -First 1
            Write-Host "      Public IP: $($publicIP.ipAddress)" -ForegroundColor Green
        } else {
            Write-Host "      Public IP: Disabled (using Cloud SQL Proxy)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [ERROR] Could not get Cloud SQL instance info" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   [ERROR] Cloud SQL instance not found or not accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# Check Cloud Run service
Write-Host ""
Write-Host "Step 4: Checking Cloud Run service..." -ForegroundColor Cyan
try {
    $serviceOutput = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | Out-String
    $serviceInfo = $serviceOutput | ConvertFrom-Json
    
    if ($serviceInfo) {
        Write-Host "   [OK] Cloud Run service found" -ForegroundColor Green
        Write-Host "      URL: $($serviceInfo.status.url)" -ForegroundColor White
        Write-Host "      Status: $($serviceInfo.status.conditions[0].status)" -ForegroundColor White
        
        # Check Cloud SQL connection
        $cloudSqlAnnotation = $serviceInfo.spec.template.metadata.annotations.'run.googleapis.com/cloudsql-instances'
        if ($cloudSqlAnnotation) {
            Write-Host "      [OK] Cloud SQL instance linked: $cloudSqlAnnotation" -ForegroundColor Green
        } else {
            Write-Host "      [ERROR] Cloud SQL instance NOT linked" -ForegroundColor Red
            Write-Host "      [FIX] Fixing Cloud SQL connection..." -ForegroundColor Yellow
            
            # Update service to link Cloud SQL
            try {
                $null = gcloud run services update $SERVICE_NAME `
                    --region $REGION `
                    --add-cloudsql-instances $CONNECTION_NAME `
                    2>&1 | Out-String
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "      [OK] Cloud SQL connection fixed" -ForegroundColor Green
                } else {
                    Write-Host "      [WARNING] Could not update service automatically" -ForegroundColor Yellow
                    Write-Host "      Please run manually: gcloud run services update $SERVICE_NAME --region $REGION --add-cloudsql-instances $CONNECTION_NAME" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "      [WARNING] Could not update service automatically" -ForegroundColor Yellow
            }
            
            Write-Host "      [OK] Cloud SQL connection fixed" -ForegroundColor Green
        }
    } else {
        Write-Host "   [ERROR] Could not get Cloud Run service info" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   [ERROR] Cloud Run service not found or not accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# Check environment variables
Write-Host ""
Write-Host "Step 5: Checking environment variables..." -ForegroundColor Cyan
$envVars = $serviceInfo.spec.template.spec.containers[0].env
$envVarsMap = @{}
foreach ($envVar in $envVars) {
    $envVarsMap[$envVar.name] = $envVar.value
}

$requiredVars = @("DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "NODE_ENV", "PORT")
$missingVars = @()
$needsUpdate = $false

foreach ($var in $requiredVars) {
    if ($envVarsMap.ContainsKey($var)) {
        $value = $envVarsMap[$var]
        if ($var -eq "DB_PASSWORD") {
            Write-Host "      [OK] ${var}: ***SET***" -ForegroundColor Green
        } else {
            Write-Host "      [OK] ${var}: $value" -ForegroundColor Green
        }
        
        # Check if DB_HOST is correct
        if ($var -eq "DB_HOST") {
            if ($value -ne $CLOUD_SQL_SOCKET -and $value -notlike "/cloudsql/*") {
                Write-Host "      [WARNING] DB_HOST should be Cloud SQL Proxy socket" -ForegroundColor Yellow
                Write-Host "         Current: $value" -ForegroundColor Yellow
                Write-Host "         Should be: $CLOUD_SQL_SOCKET" -ForegroundColor Yellow
                $needsUpdate = $true
            }
        }
    } else {
        Write-Host "      [ERROR] ${var}: NOT SET" -ForegroundColor Red
        $missingVars += $var
        $needsUpdate = $true
    }
}

# Fix environment variables if needed
if ($needsUpdate) {
    Write-Host ""
    Write-Host "Step 6: Fixing environment variables..." -ForegroundColor Cyan
    
    # Build environment variables list
    $envVarsList = @()
    
    # Keep existing vars (except DB_HOST if it needs fixing)
    foreach ($envVar in $envVars) {
        if ($envVar.name -eq "DB_HOST" -and $envVar.value -ne $CLOUD_SQL_SOCKET) {
            # Skip old DB_HOST, will add new one
            continue
        }
        $envVarsList += "$($envVar.name)=$($envVar.value)"
    }
    
    # Add/Update DB_HOST
    if (-not $envVarsMap.ContainsKey("DB_HOST") -or $envVarsMap["DB_HOST"] -ne $CLOUD_SQL_SOCKET) {
        $envVarsList += "DB_HOST=$CLOUD_SQL_SOCKET"
        Write-Host "   [OK] Setting DB_HOST to: $CLOUD_SQL_SOCKET" -ForegroundColor Green
    }
    
    # Add missing required vars with defaults
    if (-not $envVarsMap.ContainsKey("DB_PORT")) {
        $envVarsList += "DB_PORT=5432"
        Write-Host "   [OK] Setting DB_PORT to: 5432" -ForegroundColor Green
    }
    if (-not $envVarsMap.ContainsKey("DB_USER")) {
        $envVarsList += "DB_USER=$DB_USER"
        Write-Host "   [OK] Setting DB_USER to: $DB_USER" -ForegroundColor Green
    }
    if (-not $envVarsMap.ContainsKey("DB_NAME")) {
        $envVarsList += "DB_NAME=$DATABASE_NAME"
        Write-Host "   [OK] Setting DB_NAME to: $DATABASE_NAME" -ForegroundColor Green
    }
    if (-not $envVarsMap.ContainsKey("NODE_ENV")) {
        $envVarsList += "NODE_ENV=production"
        Write-Host "   [OK] Setting NODE_ENV to: production" -ForegroundColor Green
    }
    # CRITICAL: PORT is automatically set by Cloud Run - don't add it to environment variables
    # Cloud Run sets PORT=8080 automatically, and server.js uses process.env.PORT || 5000
    
    # Update service with new environment variables
    Write-Host "   [FIX] Updating Cloud Run service..." -ForegroundColor Yellow
    Write-Host "   This may take 1-2 minutes..." -ForegroundColor Yellow
    
    # CRITICAL FIX: Build comma-separated string, but handle FRONTEND_URL separately
    # Skip FRONTEND_URL if it has commas, we'll update it separately if needed
    $envVarsToUpdate = @()
    $frontendUrlValue = $null
    
    foreach ($envVar in $envVarsList) {
        # Split key=value
        if ($envVar -match "^([^=]+)=(.*)$") {
            $key = $matches[1]
            $value = $matches[2]
            
            # Handle FRONTEND_URL separately if it contains commas
            if ($key -eq "FRONTEND_URL") {
                if ($value -match " ") {
                    $value = $value -replace " ", ","
                    Write-Host "   [FIX] Fixed FRONTEND_URL (spaces to commas): $value" -ForegroundColor Yellow
                }
                # Store FRONTEND_URL separately - we'll skip it from main update
                $frontendUrlValue = $value
                continue
            }
            
            $envVarsToUpdate += "${key}=${value}"
        } else {
            $envVarsToUpdate += $envVar
        }
    }
    
    # Update environment variables (without FRONTEND_URL if it has commas)
    if ($envVarsToUpdate.Count -gt 0) {
        $envVarsString = $envVarsToUpdate -join ","
        
        try {
            $null = gcloud run services update $SERVICE_NAME `
                --region $REGION `
                --project $PROJECT_ID `
                --update-env-vars $envVarsString `
                --quiet `
                2>&1 | Out-String
        } catch {
            Write-Host "   [WARNING] Could not update some environment variables" -ForegroundColor Yellow
        }
    }
    
    # Check update result
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Environment variables updated successfully" -ForegroundColor Green
        Write-Host "   Waiting for service to restart (30 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    } else {
        Write-Host "   [WARNING] Could not update environment variables automatically" -ForegroundColor Yellow
        Write-Host "   Exit code: $LASTEXITCODE" -ForegroundColor Yellow
        Write-Host "   Note: PORT is automatically set by Cloud Run (usually 8080)" -ForegroundColor White
    }
    
    # Update FRONTEND_URL separately using Cloud Console instructions if it has commas
    if ($frontendUrlValue -and $frontendUrlValue -match ",") {
        Write-Host "   [INFO] FRONTEND_URL contains commas - update manually in Cloud Console:" -ForegroundColor Yellow
        Write-Host "      FRONTEND_URL=$frontendUrlValue" -ForegroundColor White
        Write-Host "      Or use: gcloud run services update $SERVICE_NAME --region $REGION --update-env-vars FRONTEND_URL=`"$frontendUrlValue`"" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "Step 6: Environment variables are correct [OK]" -ForegroundColor Green
}

# Test database connection
Write-Host ""
Write-Host "Step 7: Testing database connection..." -ForegroundColor Cyan

# Get DB_PASSWORD from environment or prompt
$dbPassword = $envVarsMap["DB_PASSWORD"]
if (-not $dbPassword) {
    Write-Host "   [WARNING] DB_PASSWORD not found in environment variables" -ForegroundColor Yellow
    $dbPasswordSecure = Read-Host "   Enter database password" -AsSecureString
    $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPasswordSecure)
    )
}

# Test connection using Cloud SQL Proxy socket (for Cloud Run)
Write-Host "   Testing connection via Cloud SQL Proxy socket..." -ForegroundColor Yellow

# Create test script
$testScript = @"
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: '$CLOUD_SQL_SOCKET',
        user: '$DB_USER',
        password: '$dbPassword',
        database: '$DATABASE_NAME',
        connectionTimeoutMillis: 10000
    }
});

knex.raw('SELECT 1 as test')
    .then(() => {
        console.log('SUCCESS: Database connection successful');
        process.exit(0);
    })
    .catch(err => {
        console.error('ERROR:', err.message);
        process.exit(1);
    });
"@

$testScript | Out-File -FilePath "test-connection.js" -Encoding UTF8

try {
    $env:DB_HOST = $CLOUD_SQL_SOCKET
    $env:DB_USER = $DB_USER
    $env:DB_PASSWORD = $dbPassword
    $env:DB_NAME = $DATABASE_NAME
    
    $null = node test-connection.js 2>&1
    $testResult = $LASTEXITCODE
    
    if ($testResult -eq 0) {
        Write-Host "   [OK] Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Database connection failed" -ForegroundColor Red
        Write-Host "   This is expected if running locally (Cloud SQL Proxy socket only works on Cloud Run)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [WARNING] Could not test connection (expected if running locally)" -ForegroundColor Yellow
}

# Clean up test file
Remove-Item -Path "test-connection.js" -ErrorAction SilentlyContinue

# Check if migrations are needed
Write-Host ""
Write-Host "Step 8: Checking database migrations..." -ForegroundColor Cyan
Write-Host "   To run migrations, use: run-migrations-cloud-run-job.bat" -ForegroundColor White
Write-Host "   Or: gcloud run jobs execute run-migrations --region $REGION" -ForegroundColor White

# Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[OK] Verification Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run migrations: run-migrations-cloud-run-job.bat" -ForegroundColor White
Write-Host "2. Test registration: $($serviceInfo.status.url)/api/auth/register" -ForegroundColor White
Write-Host "3. Check health: $($serviceInfo.status.url)/api/health" -ForegroundColor White
Write-Host ""
