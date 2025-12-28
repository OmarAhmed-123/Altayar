# PowerShell script to fix server.js file permissions
# This script helps resolve file write permission issues

Write-Host "🔧 Fixing server.js file permissions..." -ForegroundColor Yellow

$filePath = "E:\Altayar-app\Altayar-app-final\backend\server.js"

# Check if file exists
if (Test-Path $filePath) {
    Write-Host "✅ File exists: $filePath" -ForegroundColor Green
    
    # Get current permissions
    Write-Host "📋 Current permissions:" -ForegroundColor Cyan
    icacls $filePath
    
    # Remove read-only attribute if present
    $file = Get-Item $filePath
    if ($file.IsReadOnly) {
        Write-Host "🔓 Removing read-only attribute..." -ForegroundColor Yellow
        $file.IsReadOnly = $false
        Write-Host "✅ Read-only attribute removed" -ForegroundColor Green
    }
    
    # Try to get file handle to check if it's locked
    try {
        $stream = [System.IO.File]::Open($filePath, 'Open', 'ReadWrite', 'None')
        $stream.Close()
        Write-Host "✅ File is not locked - can be written" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ File may be locked by another process" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        
        # Try to find processes using the file
        Write-Host "🔍 Searching for processes that might be using the file..." -ForegroundColor Cyan
        $processes = Get-Process | Where-Object {
            $_.Modules | Where-Object { $_.FileName -eq $filePath }
        }
        
        if ($processes) {
            Write-Host "⚠️ Found processes using the file:" -ForegroundColor Yellow
            $processes | ForEach-Object {
                Write-Host "   - $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Yellow
            }
            Write-Host "💡 Please close these processes and try again" -ForegroundColor Cyan
        } else {
            Write-Host "✅ No processes found using the file" -ForegroundColor Green
        }
    }
    
    # Check file permissions
    $acl = Get-Acl $filePath
    Write-Host "📋 File ACL:" -ForegroundColor Cyan
    $acl.Access | ForEach-Object {
        Write-Host "   $($_.IdentityReference): $($_.FileSystemRights)" -ForegroundColor Gray
    }
    
    Write-Host "`n✅ Permission check complete!" -ForegroundColor Green
    Write-Host "💡 If the file is still locked, try:" -ForegroundColor Cyan
    Write-Host "   1. Close Cursor/VS Code and reopen it" -ForegroundColor White
    Write-Host "   2. Restart your computer" -ForegroundColor White
    Write-Host "   3. Check if antivirus is blocking the file" -ForegroundColor White
    
} else {
    Write-Host "❌ File not found: $filePath" -ForegroundColor Red
}

