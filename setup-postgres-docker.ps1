# إعداد PostgreSQL في Docker
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  إعداد PostgreSQL في Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker موجود: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker غير مثبت أو غير مشغل" -ForegroundColor Red
    Write-Host "💡 قم بتثبيت Docker Desktop من: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# التحقق من وجود container
$existingContainer = docker ps -a --filter "name=altayar-postgres" --format "{{.Names}}"
if ($existingContainer -eq "altayar-postgres") {
    Write-Host "📦 Container موجود بالفعل" -ForegroundColor Yellow
    $running = docker ps --filter "name=altayar-postgres" --format "{{.Names}}"
    if ($running -eq "altayar-postgres") {
        Write-Host "✅ Container يعمل بالفعل" -ForegroundColor Green
    } else {
        Write-Host "🔄 بدء تشغيل container..." -ForegroundColor Yellow
        docker start altayar-postgres
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ تم بدء تشغيل container" -ForegroundColor Green
            Write-Host "⏳ انتظر 5 ثواني حتى يبدأ PostgreSQL..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        } else {
            Write-Host "❌ فشل بدء تشغيل container" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "📦 إنشاء PostgreSQL container جديد..." -ForegroundColor Yellow
    
    # استخدام docker-compose إذا كان موجوداً
    if (Test-Path "docker-compose.yml") {
        Write-Host "📋 استخدام docker-compose..." -ForegroundColor Yellow
        docker-compose up -d postgres
    } else {
        Write-Host "📋 استخدام docker run..." -ForegroundColor Yellow
        docker run --name altayar-postgres `
            -e POSTGRES_PASSWORD=StrongPass123 `
            -e POSTGRES_DB=tourist_app_db `
            -p 5432:5432 `
            -d postgres:15-alpine
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ تم إنشاء container بنجاح" -ForegroundColor Green
        Write-Host "⏳ انتظر 10 ثواني حتى يبدأ PostgreSQL..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        Write-Host "❌ فشل إنشاء container" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  التحقق من PostgreSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من أن PostgreSQL يعمل
$maxRetries = 5
$retryCount = 0
$isReady = $false

while ($retryCount -lt $maxRetries -and -not $isReady) {
    $result = docker exec altayar-postgres pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        $isReady = $true
        Write-Host "✅ PostgreSQL يعمل بنجاح!" -ForegroundColor Green
    } else {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "⏳ انتظر... ($retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
}

if (-not $isReady) {
    Write-Host "⚠️  PostgreSQL لا يزال يبدأ..." -ForegroundColor Yellow
    Write-Host "💡 انتظر 10-15 ثانية ثم جرب مرة أخرى" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  معلومات الاتصال" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Host: localhost" -ForegroundColor White
Write-Host "Port: 5432" -ForegroundColor White
Write-Host "User: postgres" -ForegroundColor White
Write-Host "Password: StrongPass123" -ForegroundColor White
Write-Host "Database: tourist_app_db" -ForegroundColor White
Write-Host ""

# إنشاء ملف .env إذا لم يكن موجوداً
if (-not (Test-Path ".env")) {
    Write-Host "📝 إنشاء ملف .env..." -ForegroundColor Yellow
    @"
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=StrongPass123
DB_NAME=tourist_app_db
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure
SESSION_SECRET=your-super-secret-session-key-here-make-it-very-long-and-secure
PORT=5000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ تم إنشاء ملف .env" -ForegroundColor Green
} else {
    Write-Host "✅ ملف .env موجود" -ForegroundColor Green
    
    # تحديث DB settings في .env إذا لزم الأمر
    $envContent = Get-Content ".env" -Raw
    if ($envContent -notmatch "DB_HOST=127\.0\.0\.1") {
        Write-Host "📝 تحديث DB settings في .env..." -ForegroundColor Yellow
        $envContent = $envContent -replace "DB_HOST=.*", "DB_HOST=127.0.0.1"
        $envContent = $envContent -replace "DB_PORT=.*", "DB_PORT=5432"
        $envContent = $envContent -replace "DB_USER=.*", "DB_USER=postgres"
        $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=StrongPass123"
        $envContent = $envContent -replace "DB_NAME=.*", "DB_NAME=tourist_app_db"
        Set-Content -Path ".env" -Value $envContent -Encoding UTF8
        Write-Host "✅ تم تحديث ملف .env" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  الخطوات التالية" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ PostgreSQL يعمل في Docker" -ForegroundColor Green
Write-Host "2. 📝 ملف .env جاهز" -ForegroundColor Green
Write-Host "3. 🚀 شغّل: npm start" -ForegroundColor Yellow
Write-Host "4. 📊 شغّل migrations: npm run migrate:latest" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

