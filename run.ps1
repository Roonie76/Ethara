# EtharaAI Local Development Runner
# [ignoring loop detection]
#
# USAGE:
#   .\run.ps1                   # Start backend + frontend
#   .\run.ps1 -Seed             # Seed the database first, then start
#   .\run.ps1 -SkipNodeInstall  # Skip npm install (faster restart)

param(
    [switch]$Seed,
    [switch]$SkipNodeInstall
)

$ErrorActionPreference = "Stop"

# 1. Ensure we are running from the project root
$PROJECT_ROOT = $PSScriptRoot
if ((Get-Location).Path -match "frontend$" -or (Get-Location).Path -match "backend$") {
    Write-Host "`n[!] ERROR: Please run this script from the project root directory (EtharaAI/)." -ForegroundColor Red
    Write-Host "    Try running: cd ..; .\run.ps1" -ForegroundColor Yellow
    exit 1
}

$BACKEND_DIR  = Join-Path $PROJECT_ROOT "backend"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"

function Write-Step($Message) {
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Status($Message, $Color = "White") {
    Write-Host "  $Message" -ForegroundColor $Color
}

function Stop-Port($Port) {
    $procs = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
             Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $procs) {
        if ($p -gt 0 -and $p -ne $PID) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            Write-Status "Freed port $Port (PID $p)" Yellow
        }
    }
}

# 2. Free ports
Write-Step "Freeing Ports"
Stop-Port 5000
Stop-Port 5173

# 3. Start Database (Docker)
Write-Step "Checking Database"
docker-compose up -d db
Write-Status "Database container is running" Green

# 4. Install dependencies
if (-not $SkipNodeInstall) {
    Write-Step "Installing Dependencies"
    Push-Location $BACKEND_DIR; npm install; Pop-Location
    Push-Location $FRONTEND_DIR; npm install; Pop-Location
    Write-Status "Dependencies ready" Green
}

# 5. Seed database (optional)
if ($Seed) {
    Write-Step "Seeding Database"
    Push-Location $BACKEND_DIR
    node seed.js
    Pop-Location
    Write-Status "Database seeded" Green
}

# 6. Start backend
Write-Step "Starting Backend"
$Backend = Start-Process powershell `
    -ArgumentList "-NoProfile", "-Command", "Set-Location '$BACKEND_DIR'; npm start" `
    -PassThru -NoNewWindow
Write-Status "Backend started -> http://localhost:5000" Green
Start-Sleep -Seconds 2

# 7. Start frontend
Write-Step "Starting Frontend"
Write-Host "  Frontend  ->  http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend   ->  http://localhost:5000" -ForegroundColor White
Write-Host "`n  Press Ctrl+C to stop everything.`n" -ForegroundColor Yellow

try {
    Push-Location $FRONTEND_DIR
    npm run dev
    Pop-Location
} finally {
    Write-Step "Shutting Down"
    if ($Backend -and -not $Backend.HasExited) {
        Stop-Process -Id $Backend.Id -Force -ErrorAction SilentlyContinue
    }
    Stop-Port 5000
    Stop-Port 5173
    Write-Host "  All services stopped." -ForegroundColor Green
}
