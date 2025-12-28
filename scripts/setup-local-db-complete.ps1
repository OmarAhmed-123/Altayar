# Complete local database setup script
# This script sets up PostgreSQL locally using Docker (easiest method)

Write-Host "🔧 Complete Local Database Setup" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    $null = docker ps 2>$null
} catch {
    Write-Host "❌ Error: Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL container already exists
$existingContainer = docker ps -a --filter "name=altayar-postgres" --format "{{.Names}}" 2>$null

if ($existingContainer) {
    Write-Host "⚠️  PostgreSQL container already exists" -ForegroundColor Yellow
    $restart = Read-Host "Restart existing container? (y/n)"
    
    if ($restart -eq "y" -or $restart -eq "Y") {
        Write-Host "Starting existing container..." -ForegroundColor Cyan
        docker start altayar-postgres
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Container started" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start container" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Using existing container..." -ForegroundColor Gray
    }
} else {
    Write-Host "📦 Creating PostgreSQL container..." -ForegroundColor Cyan
    
    $dbPassword = Read-Host "Enter database password (or press Enter for default: StrongPass123)" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
    
    if ([string]::IsNullOrWhiteSpace($dbPasswordPlain)) {
        $dbPasswordPlain = "StrongPass123"
    }
    
    docker run --name altayar-postgres `
        -e POSTGRES_PASSWORD=$dbPasswordPlain `
        -e POSTGRES_DB=tourist_app_db `
        -p 5432:5432 `
        -d postgres:15-alpine
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL container created and started" -ForegroundColor Green
        Write-Host "   Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
        
        # Wait for PostgreSQL to be ready
        $maxAttempts = 30
        $attempt = 0
        $ready = $false
        
        while ($attempt -lt $maxAttempts -and -not $ready) {
            Start-Sleep -Seconds 2
            $attempt++
            
            try {
                $test = docker exec altayar-postgres pg_isready -U postgres 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $ready = $true
                }
            } catch {
                # Continue waiting
            }
        }
        
        if ($ready) {
            Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
        } else {
            Write-Host "⚠️  PostgreSQL may not be ready yet, but continuing..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Failed to create container" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📝 Creating .env file..." -ForegroundColor Cyan

# Create .env file
$envContent = @"
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=$dbPasswordPlain
DB_NAME=tourist_app_db

# Environment
NODE_ENV=development

# Server
PORT=5000
HOST=0.0.0.0

# JWT Secret (generate a secure one for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Secret (generate a secure one for production)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Frontend URL (optional)
FRONTEND_URL=http://localhost:3000
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force

Write-Host "✅ .env file created" -ForegroundColor Green
Write-Host ""

# Run migrations
Write-Host "📦 Running database migrations..." -ForegroundColor Cyan
npm run migrate:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migrations may have failed, but continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the server: npm start" -ForegroundColor White
Write-Host "2. Test health endpoint: curl http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "💡 Database connection details:" -ForegroundColor Cyan
Write-Host "   Host: 127.0.0.1" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   User: postgres" -ForegroundColor White
Write-Host "   Database: tourist_app_db" -ForegroundColor White
Write-Host "   Password: (stored in .env file)" -ForegroundColor White
Write-Host ""

