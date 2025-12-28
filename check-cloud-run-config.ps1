# PowerShell script to check Cloud Run service configuration
# This script verifies all settings needed for database connection

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Cloud Run Service Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Checking Cloud Run service..." -ForegroundColor Cyan
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if (-not $serviceInfo) {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Cloud Run service found" -ForegroundColor Green
Write-Host "   URL: $($serviceInfo.status.url)" -ForegroundColor White
Write-Host ""

# Check Cloud SQL connection
Write-Host "Step 2: Checking Cloud SQL connection..." -ForegroundColor Cyan
$cloudSqlInstances = $serviceInfo.spec.template.spec.containers[0].env | Where-Object { $_.name -eq "CLOUD_SQL_CONNECTION_NAME" }
$cloudSqlAnnotations = $serviceInfo.spec.template.metadata.annotations

$hasCloudSqlConnection = $false
if ($cloudSqlAnnotations.'run.googleapis.com/cloudsql-instances') {
    $cloudSqlInstances = $cloudSqlAnnotations.'run.googleapis.com/cloudsql-instances'
    Write-Host "SUCCESS: Cloud SQL instance linked" -ForegroundColor Green
    Write-Host "   Connection: $cloudSqlInstances" -ForegroundColor White
    $hasCloudSqlConnection = $true
} else {
    Write-Host "WARNING: Cloud SQL instance NOT linked" -ForegroundColor Yellow
    Write-Host "   Action: Run fix-database-connection-final.bat" -ForegroundColor Yellow
}

Write-Host ""

# Check environment variables
Write-Host "Step 3: Checking environment variables..." -ForegroundColor Cyan
$envVars = $serviceInfo.spec.template.spec.containers[0].env

$requiredVars = @("DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "NODE_ENV", "PORT")
$missingVars = @()
$foundVars = @{}

foreach ($var in $requiredVars) {
    $envVar = $envVars | Where-Object { $_.name -eq $var }
    if ($envVar) {
        $value = if ($var -eq "DB_PASSWORD") { "***" } else { $envVar.value }
        Write-Host "   [OK] $var = $value" -ForegroundColor Green
        $foundVars[$var] = $envVar.value
    } else {
        Write-Host "   [MISSING] $var" -ForegroundColor Red
        $missingVars += $var
    }
}

Write-Host ""

# Check DB_HOST value
if ($foundVars["DB_HOST"]) {
    $dbHost = $foundVars["DB_HOST"]
    Write-Host "Step 4: Checking DB_HOST configuration..." -ForegroundColor Cyan
    
    if ($dbHost.StartsWith("/cloudsql/")) {
        Write-Host "   Connection method: Cloud SQL Proxy (Socket)" -ForegroundColor Green
        Write-Host "   Socket path: $dbHost" -ForegroundColor White
        
        if (-not $hasCloudSqlConnection) {
            Write-Host "   WARNING: DB_HOST uses Cloud SQL Proxy but instance is not linked!" -ForegroundColor Yellow
            Write-Host "   Action: Run fix-database-connection-final.bat and choose option 1" -ForegroundColor Yellow
        } else {
            if ($dbHost -eq "/cloudsql/$CONNECTION_NAME") {
                Write-Host "   SUCCESS: Socket path matches Cloud SQL instance" -ForegroundColor Green
            } else {
                Write-Host "   WARNING: Socket path does not match Cloud SQL instance" -ForegroundColor Yellow
                Write-Host "   Expected: /cloudsql/$CONNECTION_NAME" -ForegroundColor Gray
                Write-Host "   Found: $dbHost" -ForegroundColor Gray
            }
        }
    } elseif ($dbHost -match '^\d+\.\d+\.\d+\.\d+$') {
        Write-Host "   Connection method: Public IP with SSL" -ForegroundColor Green
        Write-Host "   Public IP: $dbHost" -ForegroundColor White
    } else {
        Write-Host "   WARNING: DB_HOST format is unusual: $dbHost" -ForegroundColor Yellow
    }
} else {
    Write-Host "Step 4: Skipped (DB_HOST not found)" -ForegroundColor Gray
}

Write-Host ""

# Check IAM permissions
Write-Host "Step 5: Checking IAM permissions..." -ForegroundColor Cyan
$serviceAccount = $serviceInfo.spec.template.spec.serviceAccountName
if (-not $serviceAccount) {
    $serviceAccount = "$PROJECT_ID@appspot.gserviceaccount.com"
}

Write-Host "   Service Account: $serviceAccount" -ForegroundColor White

$iamCheck = gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --format="json" --filter="bindings.members:$serviceAccount AND bindings.role:roles/cloudsql.client" 2>&1 | ConvertFrom-Json

if ($iamCheck -and $iamCheck.bindings.Count -gt 0) {
    Write-Host "   SUCCESS: Cloud SQL Client role is granted" -ForegroundColor Green
} else {
    Write-Host "   WARNING: Cloud SQL Client role NOT granted" -ForegroundColor Yellow
    Write-Host "   Action: Run fix-cloud-sql-complete.bat" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing environment variables: $($missingVars -join ', ')" -ForegroundColor Red
    $allOk = $false
}

if (-not $hasCloudSqlConnection -and $foundVars["DB_HOST"] -and $foundVars["DB_HOST"].StartsWith("/cloudsql/")) {
    Write-Host "❌ Cloud SQL instance not linked" -ForegroundColor Red
    $allOk = $false
}

if ($allOk -and $missingVars.Count -eq 0 -and ($hasCloudSqlConnection -or ($foundVars["DB_HOST"] -and $foundVars["DB_HOST"] -match '^\d+\.\d+\.\d+\.\d+$'))) {
    Write-Host "✅ All configuration checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If database is still not connected, check logs:" -ForegroundColor Cyan
    Write-Host "   gcloud run services logs read $SERVICE_NAME --region $REGION --limit 100" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some configuration issues found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Recommended actions:" -ForegroundColor Cyan
    if ($missingVars.Count -gt 0) {
        Write-Host "   1. Run: fix-database-connection-final.bat" -ForegroundColor White
    }
    if (-not $hasCloudSqlConnection -and $foundVars["DB_HOST"] -and $foundVars["DB_HOST"].StartsWith("/cloudsql/")) {
        Write-Host "   2. Run: fix-database-connection-final.bat and choose option 1" -ForegroundColor White
    }
}

Write-Host ""

