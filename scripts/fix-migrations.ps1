# Script to fix migration issues
# This script checks and fixes migration order issues

Write-Host "🔧 Fixing Migration Issues..." -ForegroundColor Cyan
Write-Host ""

# Check if database is accessible
Write-Host "🔍 Checking database connection..." -ForegroundColor Cyan
try {
    node -e "const {db} = require('./config/db'); db.raw('SELECT 1').then(() => {console.log('✅ Database is accessible'); process.exit(0)}).catch(e => {console.log('❌', e.message); process.exit(1)})"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Cannot connect to database" -ForegroundColor Red
        Write-Host "Please ensure database is running and .env file is configured" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error checking database connection" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Checking migration status..." -ForegroundColor Cyan

# Check which migrations have been run
node -e "const {db} = require('./config/db'); db.migrate.status().then(status => {console.log(JSON.stringify(status, null, 2)); process.exit(0)}).catch(e => {console.log('Error:', e.message); process.exit(1)})"

Write-Host ""
Write-Host "💡 If migrations failed due to missing tables:" -ForegroundColor Yellow
Write-Host "1. The migration files have been fixed to check for table existence" -ForegroundColor White
Write-Host "2. Try running migrations again: npm run migrate:latest" -ForegroundColor White
Write-Host ""

# Ask if user wants to reset migrations
$reset = Read-Host "Reset migration state and run all migrations from scratch? (y/n)"
if ($reset -eq "y" -or $reset -eq "Y") {
    Write-Host ""
    Write-Host "⚠️  WARNING: This will reset all migrations!" -ForegroundColor Yellow
    Write-Host "All migration records will be cleared." -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure? Type 'yes' to confirm"
    
    if ($confirm -eq "yes") {
        Write-Host ""
        Write-Host "🔄 Resetting migrations..." -ForegroundColor Cyan
        
        # Rollback all migrations
        npm run migrate:rollback
        
        Write-Host ""
        Write-Host "📦 Running all migrations..." -ForegroundColor Cyan
        npm run migrate:latest
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Migrations failed" -ForegroundColor Red
            Write-Host "Please check the error messages above" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Cancelled." -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "📦 Running migrations..." -ForegroundColor Cyan
    npm run migrate:latest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Migrations failed" -ForegroundColor Red
        Write-Host "💡 Try running: .\scripts\fix-migrations.ps1 and choose to reset" -ForegroundColor Yellow
    }
}

Write-Host ""

