@echo off
chcp 65001 >nul
powershell -ExecutionPolicy Bypass -File "%~dp0run-migrations-cloud-run-job-with-password.ps1"
pause

