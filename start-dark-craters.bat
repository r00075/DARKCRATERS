@echo off
title DARK CRATERS - Public Multiplayer Stack

set PROJECT=C:\Users\copai\Documents\Codex\2026-05-13\create-a-browser-based-third-person

set CLIENT_DOMAIN=https://editor-saddled-surrogate.ngrok-free.dev
set SERVER_WS=wss://cannot-skirt-engulf.ngrok-free.dev

set CLIENT_NGROK_CONFIG=C:\ngrok-configs\client.yml
set SERVER_NGROK_CONFIG=C:\ngrok-configs\server.yml

cd /d "%PROJECT%"

echo ============================================
echo   DARK CRATERS PUBLIC MULTIPLAYER STACK
echo ============================================
echo.
echo Client:
echo   %CLIENT_DOMAIN%
echo.
echo Server:
echo   %SERVER_WS%
echo.
echo Client ngrok config:
echo   %CLIENT_NGROK_CONFIG%
echo.
echo Server ngrok config:
echo   %SERVER_NGROK_CONFIG%
echo.

echo Starting DARK CRATERS Colyseus server on localhost:2567...
start "DARK CRATERS SERVER" powershell -NoExit -Command "cd /d '%PROJECT%'; npm run server"

timeout /t 5

echo Starting Vite client on localhost:5173 with public server endpoint...
start "DARK CRATERS CLIENT 5173" powershell -NoExit -Command "cd /d '%PROJECT%'; $env:VITE_SERVER_URL='%SERVER_WS%'; $env:VITE_COLYSEUS_ENDPOINT='%SERVER_WS%'; npm run dev -- --host 0.0.0.0"

timeout /t 5

echo Starting CLIENT ngrok tunnel with manemzues config...
start "NGROK CLIENT 5173" powershell -NoExit -Command "ngrok http 5173 --url=editor-saddled-surrogate.ngrok-free.dev --config '%CLIENT_NGROK_CONFIG%'"

timeout /t 5

echo Starting SERVER ngrok tunnel with r4dd1x config...
start "NGROK SERVER 2567" powershell -NoExit -Command "ngrok http 2567 --url=cannot-skirt-engulf.ngrok-free.dev --config '%SERVER_NGROK_CONFIG%'"

timeout /t 5

echo Opening DARK CRATERS public client...
start "" "%CLIENT_DOMAIN%"

echo.
echo All services started.
echo Keep every opened window running.
echo.
pause