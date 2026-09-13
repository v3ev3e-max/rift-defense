@echo off
setlocal
cd /d "%~dp0"
echo [3V_TD RIFT DEFENSE] PC development launcher
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22.x first.
  pause
  exit /b 1
)
if not exist "node_modules\.bin\vite.cmd" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)
start "" http://localhost:4173
call npm run dev -- --host 127.0.0.1 --port 4173
pause
