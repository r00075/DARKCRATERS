@echo off

set PROJECT=C:\Users\copai\Documents\Codex\2026-05-13\create-a-browser-based-third-person

REM START MULTIPLAYER SERVER
start "DARK CRATERS SERVER" powershell -NoExit -Command "Set-Location '%PROJECT%'; npm run dev:server"

timeout /t 5

REM START VITE CLIENT
start "DARK CRATERS CLIENT" powershell -NoExit -Command "Set-Location '%PROJECT%'; npm run dev"

timeout /t 5

REM START CLIENT NGROK
start "NGROK CLIENT" powershell -NoExit -Command "ngrok http 5173 --url=https://shrill-doily-outgrow.ngrok-free.dev --config=C:\ngrok-configs\client.yml"

timeout /t 3

REM START SERVER NGROK
start "NGROK SERVER" powershell -NoExit -Command "ngrok http 2567 --url=https://encrust-attic-vacation.ngrok-free.dev --config=C:\ngrok-configs\server.yml"