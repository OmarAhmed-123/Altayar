# Script to fix Docker cache issues
# Run this if you encounter "parent snapshot does not exist" errors

Write-Host "🔧 Fixing Docker cache issues..." -ForegroundColor Cyan
Write-Host ""

# Stop all containers
Write-Host "1. Stopping containers..." -ForegroundColor Yellow
docker stop $(docker ps -aq) 2>$null

# Remove all containers
Write-Host "2. Removing containers..." -ForegroundColor Yellow
docker rm $(docker ps -aq) 2>$null

# Prune build cache
Write-Host "3. Pruning build cache..." -ForegroundColor Yellow
docker builder prune -af

# Prune system (optional - removes unused images, networks, etc.)
Write-Host "4. Pruning system (removes unused images)..." -ForegroundColor Yellow
$response = Read-Host "Remove unused images? This may free up space (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    docker system prune -af
}

Write-Host ""
Write-Host "✅ Docker cache cleaned!" -ForegroundColor Green
Write-Host ""
Write-Host "Now try running the deployment script again:" -ForegroundColor Cyan
Write-Host "  .\scripts\deploy.ps1" -ForegroundColor White
Write-Host ""

