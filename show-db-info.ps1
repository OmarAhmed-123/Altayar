# Show Database Information (without passwords)
# Project: altayar-46d6f

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "altayar-46d6f"
$INSTANCE_NAME = "altayar-db"
$DATABASE_NAME = "tourist_app_db"
$DB_USER = "postgres"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Information" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get instance info
Write-Host "Instance: $INSTANCE_NAME" -ForegroundColor Yellow
try {
    $instanceInfo = & $GCLOUD_CMD sql instances describe $INSTANCE_NAME --format="json" 2>&1 | ConvertFrom-Json
    
    if ($instanceInfo) {
        Write-Host "Status: $($instanceInfo.state)" -ForegroundColor Green
        Write-Host "Database Version: $($instanceInfo.databaseVersion)" -ForegroundColor White
        Write-Host "Region: $($instanceInfo.region)" -ForegroundColor White
        Write-Host "Tier: $($instanceInfo.settings.tier)" -ForegroundColor White
        Write-Host "Connection Name: $($instanceInfo.connectionName)" -ForegroundColor Cyan
        Write-Host ""
        
        # Get databases
        Write-Host "Databases:" -ForegroundColor Yellow
        $databases = & $GCLOUD_CMD sql databases list --instance=$INSTANCE_NAME --format="value(name)" 2>&1
        foreach ($db in $databases) {
            if ($db -and $db -notmatch "ERROR") {
                $marker = if ($db -eq $DATABASE_NAME) { "✓" } else { " " }
                Write-Host "  $marker $db" -ForegroundColor $(if ($db -eq $DATABASE_NAME) { "Green" } else { "White" })
            }
        }
        Write-Host ""
        
        # Get users
        Write-Host "Users:" -ForegroundColor Yellow
        $users = & $GCLOUD_CMD sql users list --instance=$INSTANCE_NAME --format="value(name)" 2>&1
        foreach ($user in $users) {
            if ($user -and $user -notmatch "ERROR") {
                $marker = if ($user -eq $DB_USER) { "✓" } else { " " }
                Write-Host "  $marker $user" -ForegroundColor $(if ($user -eq $DB_USER) { "Green" } else { "White" })
            }
        }
        Write-Host ""
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Connection String Format:" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "For Cloud Run:" -ForegroundColor Yellow
        Write-Host "  DB_HOST=/cloudsql/$($instanceInfo.connectionName)" -ForegroundColor White
        Write-Host "  DB_PORT=5432" -ForegroundColor White
        Write-Host "  DB_USER=$DB_USER" -ForegroundColor White
        Write-Host "  DB_PASSWORD=<your-password>" -ForegroundColor White
        Write-Host "  DB_NAME=$DATABASE_NAME" -ForegroundColor White
        Write-Host ""
        Write-Host "For Local (with Cloud SQL Proxy):" -ForegroundColor Yellow
        Write-Host "  DB_HOST=127.0.0.1" -ForegroundColor White
        Write-Host "  DB_PORT=5432" -ForegroundColor White
        Write-Host "  DB_USER=$DB_USER" -ForegroundColor White
        Write-Host "  DB_PASSWORD=<your-password>" -ForegroundColor White
        Write-Host "  DB_NAME=$DATABASE_NAME" -ForegroundColor White
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Security Note:" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "Passwords cannot be retrieved for security reasons." -ForegroundColor White
        Write-Host "If you forgot your password, you can reset it:" -ForegroundColor White
        Write-Host "  gcloud sql users set-password $DB_USER --instance=$INSTANCE_NAME --password=NEW_PASSWORD" -ForegroundColor Cyan
        Write-Host ""
        
    } else {
        Write-Host "ERROR: Could not get instance information" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Failed to get database information" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "1. You're logged in: gcloud auth login" -ForegroundColor White
    Write-Host "2. Project is set: gcloud config set project $PROJECT_ID" -ForegroundColor White
    Write-Host "3. Instance exists: gcloud sql instances list" -ForegroundColor White
}

Write-Host ""

