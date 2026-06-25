#!/usr/bin/env powershell
# ============================================================
# ScreenAI — Start All Services (Windows PowerShell)
# Run from the project root: .\start.ps1
# ============================================================

Write-Host "[ScreenAI] Startup Script" -ForegroundColor Cyan
Write-Host "=" * 50

# Start MongoDB (assumes mongod is on PATH)
Write-Host "`n[MongoDB] Starting..." -ForegroundColor Yellow
$mongoJob = Start-Job -ScriptBlock {
    New-Item -ItemType Directory -Path "E:\role-based -cnd-screensys RAG\data\db" -Force | Out-Null
    mongod --dbpath "E:\role-based -cnd-screensys RAG\data\db" --port 27017
}
Start-Sleep -Seconds 2
Write-Host "   MongoDB started (job: $($mongoJob.Id))" -ForegroundColor Green

# Start Backend
Write-Host "`n[Backend] Starting FastAPI..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "E:\role-based -cnd-screensys RAG\backend"
    .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}
Start-Sleep -Seconds 3
Write-Host "   Backend started at http://localhost:8000" -ForegroundColor Green

# Start Frontend
Write-Host "`n[Frontend] Starting Next.js..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "E:\role-based -cnd-screensys RAG\frontend"
    npm run dev
}
Start-Sleep -Seconds 2
Write-Host "   Frontend started at http://localhost:3000" -ForegroundColor Green

Write-Host "`n[Done] All services started!" -ForegroundColor Green
Write-Host "   [Web] Frontend : http://localhost:3000" -ForegroundColor Cyan
Write-Host "   [API] Docs     : http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   [SYS] Health   : http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host "`n[Warning] Remember to run ingestion first if ChromaDB is empty!" -ForegroundColor Yellow
Write-Host "   cd backend; .\venv\Scripts\python.exe scripts\ingest_knowledge_base.py"
Write-Host "`nPress Ctrl+C to stop all services."

# Wait
try {
    while ($true) { Start-Sleep -Seconds 5 }
} finally {
    Write-Host "`n[Stop] Stopping services..." -ForegroundColor Red
    Stop-Job $mongoJob, $backendJob, $frontendJob
    Remove-Job $mongoJob, $backendJob, $frontendJob
}
