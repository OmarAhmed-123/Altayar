@echo off
echo ========================================
echo Fixing React Native Vector Icons
echo ========================================

echo.
echo Step 1: Creating assets/fonts directory...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"
if not exist "android\app\src\main\assets\fonts" mkdir "android\app\src\main\assets\fonts"

echo.
echo Step 2: Copying fonts from node_modules...
if exist "node_modules\react-native-vector-icons\Fonts" (
    xcopy /E /I /Y "node_modules\react-native-vector-icons\Fonts\*" "android\app\src\main\assets\fonts\"
    echo Fonts copied successfully!
) else (
    echo ERROR: Fonts directory not found in node_modules!
    echo Please run: npm install react-native-vector-icons
    pause
    exit /b 1
)

echo.
echo Step 3: Cleaning Android build...
cd android
call gradlew.bat clean
cd ..

echo.
echo ========================================
echo Fix completed!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm start -- --reset-cache
echo 2. Run: npm run android
echo.
pause

