@echo off
REM Real-Time Sign Language - ngrok Setup Script
REM This script helps you set up ngrok for network access

echo.
echo ============================================
echo Real-Time Sign Language - ngrok Setup
echo ============================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: ngrok is not installed or not in PATH
    echo.
    echo Quick Setup:
    echo 1. Download ngrok from: https://ngrok.com/download
    echo 2. Extract to a folder
    echo 3. Add the folder to Windows PATH, OR
    echo 4. Run ngrok from its installation folder
    echo.
    echo After setup, run this script again.
    echo.
    pause
    exit /b 1
)

echo Found ngrok! 
echo.
echo Step 1: Make sure dev server is running
echo   Open new terminal and run: npm run dev
echo   (or use START.bat)
echo.
echo Step 2: In THIS window, enter your ngrok auth token:
echo   Get it from: https://dashboard.ngrok.com/get-started/your-authtoken
echo.
set /p token=Enter auth token (or press Enter to skip):

if not "%token%"=="" (
    ngrok config add-authtoken %token%
    echo.
    echo ✓ Auth token saved
    echo.
)

echo Step 3: Starting ngrok tunnel...
echo.
ngrok http 9002

pause
