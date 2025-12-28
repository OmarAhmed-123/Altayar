# PowerShell script to help set up local PostgreSQL database
# This script provides instructions and checks for PostgreSQL installation

Write-Host "🔧 PostgreSQL Database Setup Helper" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
$pgInstalled = $false
$pgPath = $null

# Check common installation paths
$pgPaths = @(
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe",
    "$env:ProgramFiles\PostgreSQL\*\bin\psql.exe",
    "$env:ProgramFiles(x86)\PostgreSQL\*\bin\psql.exe"
)

foreach ($path in $pgPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $pgInstalled = $true
        $pgPath = $found.FullName
        break
    }
}

# Also check if psql is in PATH
if (-not $pgInstalled) {
    try {
        $null = Get-Command psql -ErrorAction Stop
        $pgInstalled = $true
        $pgPath = "psql (in PATH)"
    } catch {
        # Not in PATH
    }
}

if ($pgInstalled) {
    Write-Host "✅ PostgreSQL is installed" -ForegroundColor Green
    Write-Host "   Location: $pgPath" -ForegroundColor Gray
    Write-Host ""
    
    # Check if PostgreSQL service is running
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        if ($pgService.Status -eq 'Running') {
            Write-Host "✅ PostgreSQL service is running" -ForegroundColor Green
        } else {
            Write-Host "⚠️  PostgreSQL service is not running" -ForegroundColor Yellow
            Write-Host "   Starting PostgreSQL service..." -ForegroundColor Gray
            try {
                Start-Service -Name $pgService.Name
                Write-Host "✅ PostgreSQL service started" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to start PostgreSQL service" -ForegroundColor Red
                Write-Host "   Please start it manually from Services (services.msc)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "⚠️  Could not find PostgreSQL service" -ForegroundColor Yellow
        Write-Host "   PostgreSQL might be installed but service is not configured" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Create database (if not exists):" -ForegroundColor White
    Write-Host "   createdb -U postgres tourist_app_db" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Create .env file in backend directory with:" -ForegroundColor White
    Write-Host "   DB_HOST=127.0.0.1" -ForegroundColor Gray
    Write-Host "   DB_PORT=5432" -ForegroundColor Gray
    Write-Host "   DB_USER=postgres" -ForegroundColor Gray
    Write-Host "   DB_PASSWORD=your_password" -ForegroundColor Gray
    Write-Host "   DB_NAME=tourist_app_db" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Run migrations:" -ForegroundColor White
    Write-Host "   npm run migrate:latest" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "❌ PostgreSQL is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 To install PostgreSQL:" -ForegroundColor Cyan
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Run the installer" -ForegroundColor White
    Write-Host "3. Remember the password you set for 'postgres' user" -ForegroundColor White
    Write-Host "4. Run this script again after installation" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Alternative: Use Docker to run PostgreSQL:" -ForegroundColor Cyan
    Write-Host "   docker run --name postgres -e POSTGRES_PASSWORD=StrongPass123 -e POSTGRES_DB=tourist_app_db -p 5432:5432 -d postgres" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Note: Server can run without database in development mode" -ForegroundColor Yellow
    Write-Host "   But database features will be disabled" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "📚 For more information, see:" -ForegroundColor Cyan
Write-Host "   - https://www.postgresql.org/docs/" -ForegroundColor Gray
Write-Host "   - README.md in backend directory" -ForegroundColor Gray
Write-Host ""

