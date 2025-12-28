# Script to run database migrations
# This ensures all database tables are created

Write-Host "📦 Running Database Migrations..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env file with default values..." -ForegroundColor Gray
    
    @"
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=StrongPass123
DB_NAME=tourist_app_db
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host ""
}

# Check if database is accessible
Write-Host "🔍 Checking database connection..." -ForegroundColor Cyan
try {
    node -e "const {db} = require('./config/db'); db.raw('SELECT 1').then(() => {console.log('✅ Database is accessible'); process.exit(0)}).catch(e => {console.log('❌', e.message); process.exit(1)})"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Cannot connect to database" -ForegroundColor Red
        Write-Host "Please ensure:" -ForegroundColor Yellow
        Write-Host "1. PostgreSQL is running" -ForegroundColor White
        Write-Host "2. Database credentials in .env are correct" -ForegroundColor White
        Write-Host "3. Database 'tourist_app_db' exists" -ForegroundColor White
        Write-Host ""
        Write-Host "To set up database, run:" -ForegroundColor Cyan
        Write-Host "  .\scripts\setup-local-db-complete.ps1" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "❌ Error checking database connection" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Running migrations..." -ForegroundColor Cyan
npm run migrate:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start the server: npm start" -ForegroundColor White
    Write-Host "2. Test health endpoint: curl http://localhost:5000/api/health" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Migrations failed" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    exit 1
}

