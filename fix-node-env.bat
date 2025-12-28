@echo off
chcp 65001 >nul
powershell -ExecutionPolicy Bypass -File "%~dp0fix-node-env.ps1"
pause

