# PowerShell script to check Cloud SQL connection and permissions
# This script verifies Cloud SQL instance is properly configured for Cloud Run

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Cloud SQL Connection Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Service: $SERVICE_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host "   Cloud SQL: $CONNECTION_NAME" -ForegroundColor White
Write-Host ""

# Check if gcloud is installed
try {
    $null = gcloud --version 2>$null
} catch {
    Write-Host "ERROR: gcloud CLI is not installed" -ForegroundColor Red
    exit 1
}

# Set project
gcloud config set project $PROJECT_ID

Write-Host "Checking Cloud SQL instance..." -ForegroundColor Cyan
$instanceInfo = gcloud sql instances describe altayar-db --format="json" 2>&1 | ConvertFrom-Json

if ($instanceInfo) {
    Write-Host "SUCCESS: Cloud SQL instance found" -ForegroundColor Green
    Write-Host "   Name: $($instanceInfo.name)" -ForegroundColor White
    Write-Host "   State: $($instanceInfo.state)" -ForegroundColor White
    Write-Host "   Connection Name: $($instanceInfo.connectionName)" -ForegroundColor White
    
    if ($instanceInfo.settings.ipConfiguration.ipv4Enabled) {
        Write-Host "   Public IP: Enabled" -ForegroundColor Green
    } else {
        Write-Host "   Public IP: Disabled" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Could not get Cloud SQL instance info" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking Cloud Run service..." -ForegroundColor Cyan
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if ($serviceInfo) {
    Write-Host "SUCCESS: Cloud Run service found" -ForegroundColor Green
    Write-Host "   Name: $($serviceInfo.metadata.name)" -ForegroundColor White
    Write-Host "   URL: $($serviceInfo.status.url)" -ForegroundColor White
    
    # Check Cloud SQL connections
    $cloudSqlConnections = $serviceInfo.spec.template.spec.containers[0].env | Where-Object { $_.name -eq "CLOUD_SQL_CONNECTION_NAME" }
    if ($cloudSqlConnections) {
        Write-Host "   Cloud SQL Connection: Found" -ForegroundColor Green
    } else {
        Write-Host "   Cloud SQL Connection: NOT FOUND" -ForegroundColor Red
        Write-Host "   Action: Run fix-database-connection-final.bat" -ForegroundColor Yellow
    }
    
    # Check environment variables
    Write-Host ""
    Write-Host "Environment Variables:" -ForegroundColor Cyan
    $dbHost = ($serviceInfo.spec.template.spec.containers[0].env | Where-Object { $_.name -eq "DB_HOST" }).value
    if ($dbHost) {
        Write-Host "   DB_HOST: $dbHost" -ForegroundColor White
        if ($dbHost -eq "/cloudsql/$CONNECTION_NAME") {
            Write-Host "   Status: Correct (Cloud SQL Proxy)" -ForegroundColor Green
        } elseif ($dbHost -match "^\d+\.\d+\.\d+\.\d+$") {
            Write-Host "   Status: Using Public IP" -ForegroundColor Yellow
        } else {
            Write-Host "   Status: May be incorrect" -ForegroundColor Red
        }
    } else {
        Write-Host "   DB_HOST: NOT SET" -ForegroundColor Red
        Write-Host "   Action: Run fix-database-connection-final.bat" -ForegroundColor Yellow
    }
    
    $dbPassword = ($serviceInfo.spec.template.spec.containers[0].env | Where-Object { $_.name -eq "DB_PASSWORD" }).value
    if ($dbPassword) {
        Write-Host "   DB_PASSWORD: Set" -ForegroundColor Green
    } else {
        Write-Host "   DB_PASSWORD: NOT SET" -ForegroundColor Red
        Write-Host "   Action: Run fix-database-connection-final.bat" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking IAM permissions..." -ForegroundColor Cyan
$serviceAccount = $serviceInfo.spec.template.spec.serviceAccountName
if (-not $serviceAccount) {
    $serviceAccount = "$PROJECT_ID@appspot.gserviceaccount.com"
}

Write-Host "   Service Account: $serviceAccount" -ForegroundColor White

$iamPolicy = gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --format="json" --filter="bindings.members:$serviceAccount" 2>&1 | ConvertFrom-Json

$hasCloudSqlClient = $false
if ($iamPolicy) {
    foreach ($binding in $iamPolicy.bindings) {
        if ($binding.members -contains $serviceAccount -and $binding.role -eq "roles/cloudsql.client") {
            $hasCloudSqlClient = $true
            break
        }
    }
}

if ($hasCloudSqlClient) {
    Write-Host "   Cloud SQL Client role: Granted" -ForegroundColor Green
} else {
    Write-Host "   Cloud SQL Client role: NOT GRANTED" -ForegroundColor Red
    Write-Host "   Action: Grant Cloud SQL Client role to service account" -ForegroundColor Yellow
    Write-Host "   Command: gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$serviceAccount --role=roles/cloudsql.client" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($dbHost -and $dbPassword -and $hasCloudSqlClient) {
    Write-Host "SUCCESS: All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If database is still not connecting:" -ForegroundColor Yellow
    Write-Host "1. Check Cloud Run logs for connection errors" -ForegroundColor White
    Write-Host "2. Verify database password is correct" -ForegroundColor White
    Write-Host "3. Try Public IP connection method" -ForegroundColor White
} else {
    Write-Host "WARNING: Some checks failed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Recommended actions:" -ForegroundColor Cyan
    if (-not $dbHost -or -not $dbPassword) {
        Write-Host "1. Run: fix-database-connection-final.bat" -ForegroundColor White
    }
    if (-not $hasCloudSqlClient) {
        Write-Host "2. Grant Cloud SQL Client role to service account" -ForegroundColor White
    }
}

Write-Host ""

