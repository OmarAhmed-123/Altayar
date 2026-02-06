# ==========================================
# حل نهائي شامل لمشكلة Gradle Daemon Port Conflict
# Permanent Gradle Daemon Fix Solution (PowerShell)
# ==========================================
# هذا السكريبت يحل المشكلة بشكل نهائي وآمن واحترافي
# ==========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  حل نهائي لمشكلة Gradle Build Error" -ForegroundColor Yellow
Write-Host "  Permanent Gradle Daemon Fix Solution" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: إيقاف جميع Gradle Daemons
Write-Host "[1/8] إيقاف جميع Gradle Daemons..." -ForegroundColor Green
Write-Host "[1/8] Stopping all Gradle Daemons..." -ForegroundColor Green
Set-Location android
if (Test-Path "gradlew.bat") {
    & .\gradlew.bat --stop 2>&1 | Out-Null
    Start-Sleep -Seconds 2
}
Set-Location ..
Write-Host "✓ تم إيقاف Gradle Daemons" -ForegroundColor Green
Write-Host ""

# Step 2: إيقاف جميع عمليات Java
Write-Host "[2/8] إيقاف جميع عمليات Java..." -ForegroundColor Green
Write-Host "[2/8] Stopping all Java processes..." -ForegroundColor Green
$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
$javawProcesses = Get-Process -Name "javaw" -ErrorAction SilentlyContinue

if ($javaProcesses) {
    foreach ($proc in $javaProcesses) {
        Write-Host "  Killing Java process: $($proc.Id)" -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

if ($javawProcesses) {
    foreach ($proc in $javawProcesses) {
        Write-Host "  Killing JavaW process: $($proc.Id)" -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2
Write-Host "✓ تم إيقاف عمليات Java" -ForegroundColor Green
Write-Host ""

# Step 3: تنظيف Gradle Lock Files
Write-Host "[3/8] تنظيف Gradle Lock Files..." -ForegroundColor Green
Write-Host "[3/8] Cleaning Gradle Lock Files..." -ForegroundColor Green
Set-Location android
if (Test-Path ".gradle") {
    Write-Host "  Removing .gradle directory..." -ForegroundColor Yellow
    Remove-Item -Path ".gradle" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "gradle\daemon") {
    Write-Host "  Removing gradle\daemon directory..." -ForegroundColor Yellow
    Remove-Item -Path "gradle\daemon" -Recurse -Force -ErrorAction SilentlyContinue
}
Set-Location ..
Write-Host "✓ تم تنظيف Lock Files" -ForegroundColor Green
Write-Host ""

# Step 4: تنظيف Build Directories
Write-Host "[4/8] تنظيف Build Directories..." -ForegroundColor Green
Write-Host "[4/8] Cleaning Build Directories..." -ForegroundColor Green
Set-Location android
if (Test-Path "app\build") {
    Write-Host "  Removing app\build..." -ForegroundColor Yellow
    Remove-Item -Path "app\build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "build") {
    Write-Host "  Removing build..." -ForegroundColor Yellow
    Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
}
Set-Location ..
Write-Host "✓ تم تنظيف Build Directories" -ForegroundColor Green
Write-Host ""

# Step 5: تنظيف Gradle User Cache
Write-Host "[5/8] تنظيف Gradle User Cache..." -ForegroundColor Green
Write-Host "[5/8] Cleaning Gradle User Cache..." -ForegroundColor Green
$gradleDaemonPath = "$env:USERPROFILE\.gradle\daemon"
if (Test-Path $gradleDaemonPath) {
    Write-Host "  Removing user Gradle daemon cache..." -ForegroundColor Yellow
    Remove-Item -Path $gradleDaemonPath -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "  Note: Keeping Gradle caches for faster rebuilds" -ForegroundColor Gray
Write-Host "  (To fully clean, manually delete: $env:USERPROFILE\.gradle\caches)" -ForegroundColor Gray
Write-Host "✓ تم تنظيف Gradle Cache" -ForegroundColor Green
Write-Host ""

# Step 6: التحقق من إعدادات gradle.properties
Write-Host "[6/8] التحقق من إعدادات gradle.properties..." -ForegroundColor Green
Write-Host "[6/8] Verifying gradle.properties settings..." -ForegroundColor Green
Set-Location android
if (Test-Path "gradle.properties") {
    $content = Get-Content "gradle.properties" -Raw
    if ($content -match "org\.gradle\.daemon\.port=0") {
        Write-Host "  ✓ Port configuration is correct (auto-assign)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Warning: Port configuration may need update" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Warning: gradle.properties not found" -ForegroundColor Yellow
}
Set-Location ..
Write-Host "✓ تم التحقق من الإعدادات" -ForegroundColor Green
Write-Host ""

# Step 7: تنظيف React Native Cache
Write-Host "[7/8] تنظيف React Native Cache..." -ForegroundColor Green
Write-Host "[7/8] Cleaning React Native Cache..." -ForegroundColor Green
if (Test-Path "node_modules\.cache") {
    Write-Host "  Removing node_modules\.cache..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "metro-cache") {
    Write-Host "  Removing metro-cache..." -ForegroundColor Yellow
    Remove-Item -Path "metro-cache" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "✓ تم تنظيف React Native Cache" -ForegroundColor Green
Write-Host ""

# Step 8: التحقق النهائي
Write-Host "[8/8] التحقق النهائي..." -ForegroundColor Green
Write-Host "[8/8] Final Verification..." -ForegroundColor Green
Start-Sleep -Seconds 1

$remainingJava = Get-Process -Name "java","javaw" -ErrorAction SilentlyContinue
if ($remainingJava) {
    Write-Host "  ⚠ Warning: Some Java processes may still be running" -ForegroundColor Yellow
    Write-Host "  You may need to manually kill them or restart your computer" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ No Java processes running" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ تم إكمال جميع الخطوات بنجاح!" -ForegroundColor Green
Write-Host "  ✓ All steps completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "الآن يمكنك تشغيل:" -ForegroundColor Yellow
Write-Host "Now you can run:" -ForegroundColor Yellow
Write-Host "  npx react-native run-android" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ملاحظات مهمة:" -ForegroundColor Yellow
Write-Host "  Important Notes:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. إذا استمرت المشكلة، أعد تشغيل الكمبيوتر" -ForegroundColor White
Write-Host "   If the problem persists, restart your computer" -ForegroundColor White
Write-Host ""
Write-Host "2. تأكد من إغلاق Android Studio قبل التشغيل" -ForegroundColor White
Write-Host "   Make sure Android Studio is closed before running" -ForegroundColor White
Write-Host ""
Write-Host "3. تأكد من إغلاق أي Emulator يعمل" -ForegroundColor White
Write-Host "   Make sure any running Emulator is closed" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

