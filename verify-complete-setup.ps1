# PowerShell script to verify complete setup - Database, Backend, Frontend
# This script checks all components are properly configured

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 Complete Setup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allChecksPassed = $true

# Configuration
$BACKEND_URL = "https://altayar-backend-kuwjte4rda-uc.a.run.app"
$API_URL = "$BACKEND_URL/api"
$HEALTH_URL = "$API_URL/health"

# Check 1: Backend Health
Write-Host "1️⃣ Checking Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $HEALTH_URL -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "   ✅ Backend is responding" -ForegroundColor Green
        Write-Host "      Status: $($healthData.status)" -ForegroundColor Gray
        Write-Host "      Environment: $($healthData.environment)" -ForegroundColor Gray
        
        if ($healthData.database) {
            if ($healthData.database.status -eq "connected") {
                Write-Host "   ✅ Database is connected" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Database is not connected" -ForegroundColor Yellow
                Write-Host "      Status: $($healthData.database.status)" -ForegroundColor Gray
                Write-Host "      Message: $($healthData.database.message)" -ForegroundColor Gray
                $allChecksPassed = $false
            }
        }
    } else {
        Write-Host "   ❌ Backend returned status code: $($response.StatusCode)" -ForegroundColor Red
        $allChecksPassed = $false
    }
} catch {
    Write-Host "   ❌ Backend is not responding" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
    $allChecksPassed = $false
}

Write-Host ""

# Check 2: Test Register Endpoint
Write-Host "2️⃣ Testing Register Endpoint..." -ForegroundColor Yellow
try {
    $testData = @{
        firstName = "Test"
        lastName = "User"
        email = "test$(Get-Random -Maximum 10000)@example.com"
        password = "Test123456"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_URL/auth/register" -Method POST -Body $testData -ContentType "application/json" -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
        Write-Host "   ✅ Register endpoint is working" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Register endpoint returned: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -match "ECONNREFUSED") {
        Write-Host "   ❌ ECONNREFUSED error detected!" -ForegroundColor Red
        Write-Host "      This means database connection is not configured correctly" -ForegroundColor Gray
        Write-Host "      Run: fix-database-connection-final.bat" -ForegroundColor Yellow
        $allChecksPassed = $false
    } elseif ($errorMessage -match "500") {
        Write-Host "   ⚠️  Server error (500) - may be database connection issue" -ForegroundColor Yellow
        Write-Host "      Check Cloud Run logs for details" -ForegroundColor Gray
    } else {
        Write-Host "   ℹ️  Register endpoint test: $errorMessage" -ForegroundColor Gray
    }
}

Write-Host ""

# Check 3: Check Frontend Configuration
Write-Host "3️⃣ Checking Frontend Configuration..." -ForegroundColor Yellow
$flutterPaths = @(
    "E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart",
    "E:\Altayar82\lib\core\config\app_config.dart"
)

$frontendFound = $false
foreach ($path in $flutterPaths) {
    if (Test-Path $path) {
        $frontendFound = $true
        $content = Get-Content $path -Raw
        if ($content -match "altayar-backend-kuwjte4rda-uc\.a\.run\.app") {
            Write-Host "   ✅ Flutter config found and contains correct backend URL" -ForegroundColor Green
            Write-Host "      Path: $path" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  Flutter config found but may need update" -ForegroundColor Yellow
            Write-Host "      Path: $path" -ForegroundColor Gray
            Write-Host "      Run: node update-frontend-config.js $BACKEND_URL" -ForegroundColor Yellow
        }
        break
    }
}

if (-not $frontendFound) {
    Write-Host "   ⚠️  Flutter config file not found in expected locations" -ForegroundColor Yellow
    Write-Host "      Searched: $($flutterPaths -join ', ')" -ForegroundColor Gray
}

Write-Host ""

# Check 4: Environment Variables Check
Write-Host "4️⃣ Checking Environment Variables..." -ForegroundColor Yellow
Write-Host "   ℹ️  To check Cloud Run environment variables:" -ForegroundColor Gray
Write-Host "      gcloud run services describe altayar-backend --region us-central1 --format='value(spec.template.spec.containers[0].env)'" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allChecksPassed) {
    Write-Host "✅ All Critical Checks Passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test register/login from your app" -ForegroundColor White
    Write-Host "2. Monitor Cloud Run logs for any issues" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some Issues Detected" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Recommended Actions:" -ForegroundColor Cyan
    Write-Host "1. If database is not connected:" -ForegroundColor White
    Write-Host "   Run: fix-database-connection-final.bat" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2. If ECONNREFUSED error appears:" -ForegroundColor White
    Write-Host "   Run: fix-database-connection-final.bat" -ForegroundColor Yellow
    Write-Host "   Choose option 1 (Cloud SQL Proxy)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Check Cloud Run logs:" -ForegroundColor White
    Write-Host "   gcloud run services logs read altayar-backend --region us-central1" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

