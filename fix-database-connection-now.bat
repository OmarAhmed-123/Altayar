@echo off
chcp 65001 >nul
powershell -ExecutionPolicy Bypass -File "%~dp0fix-database-connection-now.ps1"
pause

