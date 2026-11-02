@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 22.12 或更新版本。
  pause
  exit /b 1
)
if not exist "node_modules\vite" (
  call npm install --no-audit --no-fund
  if errorlevel 1 exit /b 1
)
echo 画皮：借面 — 请在浏览器打开 http://127.0.0.1:4173/
call npm run dev
