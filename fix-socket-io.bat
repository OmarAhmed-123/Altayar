@echo off
echo ========================================
echo Fixing socket.io-client Installation
echo ========================================

cd /d E:\Altayar82

echo.
echo Step 1: Removing old installation...
call npm uninstall socket.io-client

echo.
echo Step 2: Clearing cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .metro rmdir /s /q .metro

echo.
echo Step 3: Installing socket.io-client...
call npm install socket.io-client@4.8.1 --save --legacy-peer-deps --force

echo.
echo Step 4: Verifying installation...
if exist node_modules\socket.io-client (
    echo [SUCCESS] socket.io-client installed successfully!
    dir node_modules\socket.io-client\package.json
) else (
    echo [ERROR] socket.io-client installation failed!
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Stop Metro Bundler (Ctrl+C)
echo 2. Run: npx react-native start --reset-cache
echo 3. Rebuild the app: npx react-native run-android
echo.
pause

