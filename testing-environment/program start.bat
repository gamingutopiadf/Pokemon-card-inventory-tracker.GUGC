@echo off
cd /d %~dp0
cd testing-environment

REM Check if server is already running on port 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do set PID=%%a
if defined PID (
    echo Server already running on port 3001. Refreshing browser...
    call refresh.bat
) else (
    echo Starting server and opening browser...
    start http://localhost:3001
    live-server --port=3001 --no-browser
)
pause
