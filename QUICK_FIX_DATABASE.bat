@echo off
echo ========================================
echo Adding Reels Columns to Blogs Table
echo ========================================
echo.

cd /d E:\Altayar-app\Altayar-app-final\backend

echo Running migration script...
node add-reels-columns.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Columns added successfully.
    echo ========================================
    echo.
    echo Please restart your backend server:
    echo   npm start
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR! Please check the error above.
    echo ========================================
    echo.
    echo You can also try running SQL manually:
    echo   psql -U postgres -d tourist_app_db
    echo   ALTER TABLE blogs ADD COLUMN IF NOT EXISTS media_url VARCHAR(255);
    echo   ALTER TABLE blogs ADD COLUMN IF NOT EXISTS media_type VARCHAR(50);
    echo   ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_reel BOOLEAN DEFAULT false;
    echo.
)

pause

