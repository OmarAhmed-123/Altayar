@echo off
REM Quick script to setup GitHub repository for Railway deployment

echo ========================================
echo Setup GitHub Repository
echo ========================================
echo.
echo This will help you push code to GitHub for Railway deployment
echo.

REM Check if git is initialized
if not exist .git (
    echo Initializing git repository...
    git init
    echo.
)

REM Check if .gitignore exists
if not exist .gitignore (
    echo Creating .gitignore...
    copy /Y nul .gitignore >nul
    echo node_modules/ >> .gitignore
    echo .env >> .gitignore
    echo uploads/ >> .gitignore
    echo memberships/ >> .gitignore
    echo.
)

echo Current git status:
git status
echo.

set /p GITHUB_URL="Enter your GitHub repository URL (or press Enter to skip): "

if not "%GITHUB_URL%"=="" (
    echo.
    echo Adding remote...
    git remote remove origin 2>nul
    git remote add origin %GITHUB_URL%
    echo.
    echo Staging files...
    git add .
    echo.
    echo Committing...
    git commit -m "Ready for Railway deployment"
    echo.
    echo Pushing to GitHub...
    git push -u origin main
    echo.
    echo OK: Code pushed to GitHub!
    echo.
    echo Next steps:
    echo 1. Go to: https://railway.app
    echo 2. Login with GitHub
    echo 3. New Project -^> Deploy from GitHub
    echo 4. Select your repository
    echo.
) else (
    echo.
    echo Skipped. You can manually:
    echo 1. Create repository on GitHub
    echo 2. Run: git remote add origin YOUR_REPO_URL
    echo 3. Run: git push -u origin main
    echo.
)

pause

