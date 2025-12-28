@echo off
chcp 65001 >nul
powershell -ExecutionPolicy Bypass -File "%~dp0run-migrations-direct.ps1"
pause

