@echo off
echo Initializing Git...
git init
if %errorlevel% neq 0 echo Failed to init git & pause & exit /b %errorlevel%

echo Configuring Remote...
git remote remove origin 2>nul
git remote add origin https://github.com/OmarAhmed-123/Altayar
if %errorlevel% neq 0 echo Failed to add remote & pause & exit /b %errorlevel%

echo Creating Branch...
git checkout -b reactnative_0.76.3 2>nul
if %errorlevel% neq 0 git checkout reactnative_0.76.3
if %errorlevel% neq 0 echo Failed to checkout branch & pause & exit /b %errorlevel%

echo Staging Files...
git add .
if %errorlevel% neq 0 echo Failed to add files & pause & exit /b %errorlevel%

echo Committing...
git commit -m "Initial commit for reactnative_0.76.3"

echo Pushing to GitHub...
git push -u origin reactnative_0.76.3
if %errorlevel% neq 0 echo Push failed. Please check your internet connection and permissions. & pause & exit /b %errorlevel%

echo Done.
pause
