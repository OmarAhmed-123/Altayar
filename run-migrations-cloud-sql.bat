@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0run-migrations-cloud-sql.ps1"
pause

