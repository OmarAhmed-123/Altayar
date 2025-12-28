@echo off
echo ========================================
echo 🚀 Starting Altayar Backend - Complete Setup
echo ========================================
echo.

:: Check if Docker is running
echo [1/4] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo ✅ Docker is running.

:: Check if PostgreSQL container exists
echo.
echo [2/4] Checking PostgreSQL container...
docker ps -a --filter "name=altayar-postgres" --format "{{.Names}}" | findstr /I "altayar-postgres" >nul
if %errorlevel% neq 0 (
    echo ⚠️ Container 'altayar-postgres' does not exist. Creating it...
    docker run --name altayar-postgres ^
        -e POSTGRES_PASSWORD=StrongPass123 ^
        -e POSTGRES_DB=tourist_app_db ^
        -p 5432:5432 ^
        -d postgres:15-alpine
    if %errorlevel% neq 0 (
        echo ❌ Failed to create container.
        pause
        exit /b 1
    )
    echo ✅ Container created. Waiting 15 seconds for PostgreSQL to start...
    timeout /t 15 /nobreak >nul
) else (
    echo ✅ Container exists. Checking if running...
    docker inspect -f "{{.State.Status}}" altayar-postgres | findstr /I "running" >nul
    if %errorlevel% neq 0 (
        echo 🔄 Starting container...
        docker start altayar-postgres
        if %errorlevel% neq 0 (
            echo ❌ Failed to start container.
            pause
            exit /b 1
        )
        echo ✅ Container started. Waiting 10 seconds for PostgreSQL to be ready...
        timeout /t 10 /nobreak >nul
    ) else (
        echo ✅ Container is already running.
    )
)

:: Test PostgreSQL connection
echo.
echo [3/4] Testing PostgreSQL connection...
docker exec altayar-postgres pg_isready -U postgres -h localhost >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ PostgreSQL is not ready yet. Waiting 5 more seconds...
    timeout /t 5 /nobreak >nul
    docker exec altayar-postgres pg_isready -U postgres -h localhost >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ PostgreSQL is still not ready. Check logs: docker logs altayar-postgres
        pause
        exit /b 1
    )
)
echo ✅ PostgreSQL is ready.

:: Check .env file
echo.
echo [4/4] Checking .env file...
if not exist .env (
    echo ⚠️ .env file not found. Creating it...
    (
        echo DB_HOST=127.0.0.1
        echo DB_PORT=5432
        echo DB_USER=postgres
        echo DB_PASSWORD=StrongPass123
        echo DB_NAME=tourist_app_db
        echo NODE_ENV=development
        echo JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure
        echo SESSION_SECRET=your-super-secret-session-key-here-make-it-very-long-and-secure
        echo PORT=5000
        echo FRONTEND_URL=http://localhost:3000
        echo BACKEND_URL=http://localhost:5000
    ) > .env
    echo ✅ .env file created.
) else (
    echo ✅ .env file exists.
)

:: Start the server
echo.
echo ========================================
echo 🚀 Starting Node.js server...
echo ========================================
echo.
npm start

