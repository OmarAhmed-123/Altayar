@echo off
REM Quick guide to deploy to Railway (free, no billing needed)

echo ========================================
echo Deploy to Railway - Free Solution
echo ========================================
echo.
echo Railway is FREE and doesn't need billing!
echo.
echo Steps:
echo 1. Push code to GitHub
echo 2. Go to: https://railway.app
echo 3. Login with GitHub
echo 4. New Project -^> Deploy from GitHub
echo 5. Add PostgreSQL database
echo 6. Add environment variables
echo 7. Deploy!
echo.
echo See RAILWAY_DEPLOYMENT.md for details
echo.
echo Would you like to setup GitHub now? (Y/n)
set /p SETUP_GITHUB="> "

if /i "%SETUP_GITHUB%"=="Y" (
    call setup-github.bat
)

pause

