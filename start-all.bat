@echo off
title RACSim - Launch All 4 Services
echo ========================================================
echo  Starting RACSim Interview Simulation Platform
echo ========================================================
echo.

echo [1/4] Starting Backend REST API & WebRTC Signaling on Port 5000...
start "RACSim Backend (Port 5000)" cmd /k "cd /d E:\interview-simulation-backend\server && node src/index.js"

timeout /t 2 /nobreak >nul

echo [2/4] Starting AI Semantic Embedding Service on Port 5050...
start "RACSim AI Service (Port 5050)" cmd /k "cd /d E:\interview-simulation-backend\backend && python ai_embedding_service.py"

timeout /t 2 /nobreak >nul

echo [3/4] Starting Candidate Portal on Port 3000...
start "RACSim Candidate Portal (Port 3000)" cmd /k "cd /d E:\interview-simulation-backend\frontend && npm run dev:candidate"

timeout /t 2 /nobreak >nul

echo [4/4] Starting Interviewer / Selector Console on Port 3001...
start "RACSim Selector Console (Port 3001)" cmd /k "cd /d E:\interview-simulation-backend\frontend && npm run dev:interviewer"

echo.
echo ========================================================
echo  All 4 services have been launched!
echo.
echo  * Candidate Portal:       http://localhost:3000
echo  * Selector Console:       http://localhost:3001
echo  * Backend & WebRTC:       http://localhost:5000
echo  * AI Semantic Service:    http://localhost:5050
echo ========================================================
pause
