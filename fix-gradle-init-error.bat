@echo off
echo ========================================
echo Fixing Gradle Init Script Error
echo ========================================
echo.

echo Step 1: Cleaning Gradle cache...
cd android
if exist .gradle rmdir /s /q .gradle
if exist build rmdir /s /q build
if exist app\build rmdir /s /q app\build
cd ..

echo Step 2: Cleaning Gradle wrapper cache...
if exist "%USERPROFILE%\.gradle\wrapper\dists" (
    echo Cleaning Gradle wrapper distributions...
    rmdir /s /q "%USERPROFILE%\.gradle\wrapper\dists"
)

echo Step 3: Verifying init.gradle exists...
if exist "android\gradle\init.gradle" (
    echo ✓ init.gradle found
) else (
    echo ✗ init.gradle not found - creating it...
    mkdir android\gradle 2>nul
    echo // Gradle Init Script > android\gradle\init.gradle
    echo // Prevents IDE initialization errors >> android\gradle\init.gradle
)

echo Step 4: Testing Gradle wrapper...
cd android
call gradlew.bat --version
if %ERRORLEVEL% EQU 0 (
    echo ✓ Gradle wrapper is working
) else (
    echo ✗ Gradle wrapper error - downloading fresh wrapper...
    call gradlew.bat wrapper --gradle-version 9.0.0
)

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Restart Cursor/VS Code
echo 2. Try building the project again
echo 3. If error persists, check .vscode/settings.json
echo.
pause

