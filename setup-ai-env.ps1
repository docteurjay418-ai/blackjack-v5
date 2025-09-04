param(
  [string]$EnvName = "bj-tf",
  [string]$RepoPath = "$(Resolve-Path .)\Artificial-Intelligence-in-BlackJack-Card-Counting"
)

Write-Host "Setting up environment '$EnvName' for repo: $RepoPath" -ForegroundColor Cyan
if (-not (Test-Path $RepoPath)) { Write-Error "Repo path not found: $RepoPath"; exit 1 }

$reqPinned = Join-Path $RepoPath 'requirements.win.txt'
$reqOrig   = Join-Path $RepoPath 'requirements.txt'
if (-not (Test-Path $reqPinned)) { Write-Error "Pinned requirements not found: $reqPinned"; exit 1 }

function Install-With-Conda {
  param([string]$EnvName,[string]$ReqFile)
  Write-Host "Conda detected. Creating env '$EnvName' (Python 3.11)…" -ForegroundColor Green
  conda create -n $EnvName python=3.11 -y || throw "Conda create failed"
  Write-Host "Installing requirements from: $ReqFile" -ForegroundColor Green
  conda run -n $EnvName python -m pip install -U pip
  conda run -n $EnvName python -m pip install -r $ReqFile || throw "Pip install failed"
  Write-Host "Done. Activate with: conda activate $EnvName" -ForegroundColor Yellow
}

function Install-With-Venv {
  param([string]$ReqFile)
  Write-Host "Conda not found. Using Python 3.11 venv…" -ForegroundColor Green
  $py311 = & py -3.11 -c "import sys;print(sys.version.split()[0])" 2>$null
  if (-not $py311) { Write-Error "Python 3.11 not found. Install from https://www.python.org/downloads/"; exit 1 }
  Push-Location $RepoPath
  try {
    py -3.11 -m venv .venv || throw "venv create failed"
    .\.venv\Scripts\Activate.ps1
    python -m pip install -U pip
    python -m pip install -r $ReqFile || throw "Pip install failed"
    Write-Host "Done. Activate next time with: `"$RepoPath\.venv\Scripts\Activate.ps1`"" -ForegroundColor Yellow
  } finally {
    Pop-Location
  }
}

# Prefer pinned requirements for Windows compatibility
$req = $reqPinned

# Try conda first
try {
  $condaVersion = conda --version 2>$null
  if ($LASTEXITCODE -eq 0) { Install-With-Conda -EnvName $EnvName -ReqFile $req }
  else { throw "conda missing" }
}
catch {
  Install-With-Venv -ReqFile $req
}

Write-Host "Environment setup complete." -ForegroundColor Cyan

