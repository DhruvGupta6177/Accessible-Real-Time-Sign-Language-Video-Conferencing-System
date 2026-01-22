@echo off
REM Real-Time Sign Language - Quick Start Script
REM This script starts the development server

cd /d "%~dp0"

echo.
echo ============================================
echo Real-Time Sign Language - Dev Server
echo ============================================
echo.
echo Starting server on: http://localhost:9002
echo.

npm run dev

pause
