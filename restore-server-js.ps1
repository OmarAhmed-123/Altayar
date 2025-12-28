# PowerShell script to restore server.js from backup if needed
# This script helps restore the file if Cursor has a lock on it

Write-Host "🔧 Restoring server.js from backup..." -ForegroundColor Yellow

$backupFile = "server.js.backup"
$targetFile = "server.js"

if (Test-Path $backupFile) {
    Write-Host "✅ Backup file found: $backupFile" -ForegroundColor Green
    
    # Try to copy the backup
    try {
        Copy-Item $backupFile $targetFile -Force
        Write-Host "✅ File restored successfully!" -ForegroundColor Green
        Write-Host "💡 Now try to save the file in Cursor" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Failed to restore file: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Try closing Cursor and running this script again" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Backup file not found: $backupFile" -ForegroundColor Red
}

