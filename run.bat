@echo off
rem -------------------------------------------------
rem  MediFlow – start backend and frontend together
rem -------------------------------------------------

rem ==== 1. Start the Express API (backend) ====
start "MediFlow-API" cmd /c "cd server && node server.js"

rem ==== 2. Start the Vite dev server (frontend) ====
start "MediFlow-UI" cmd /c "cd client && npm run dev"

rem ==== 3. Optional – open the UI in the default browser ====
timeout /t 5 >nul
start http://localhost:5173

echo.
echo 🎉  MediFlow is now running:
echo   API  → http://localhost:5000
echo   UI   → http://localhost:5173
echo.

