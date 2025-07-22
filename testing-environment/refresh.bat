@echo off
REM This script refreshes the browser by closing and reopening the tab
REM Only works if browser is Edge or Chrome and tab is open
REM You can customize this for your browser if needed

taskkill /IM msedge.exe /F >nul 2>&1
start msedge.exe http://localhost:3001
exit
