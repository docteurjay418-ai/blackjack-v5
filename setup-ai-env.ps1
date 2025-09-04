param(
  [string]$EnvName = "bj-tf",
  [string]$RepoPath = "$(Join-Path (Resolve-Path .) 'Artificial-Intelligence-in-BlackJack-Card-Counting')"
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
  param(
    [string]$RepoPath,
    [string]$ReqFile
  )
  Write-Host "Conda not found. Using Python 3.11 venv…" -ForegroundColor Green
  $hasPy311 = $false
  try { & py -3.11 -c "import sys;print(sys.version)" 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { $hasPy311 = $true } } catch {}
  if (-not $hasPy311) {
    try {
      $ver = & python -c "import sys;print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
      if ($LASTEXITCODE -ne 0 -or $ver -ne "3.11") { throw "no311" }
    } catch {
      Write-Error "Python 3.11 not found. Install from https://www.python.org/downloads/"
      exit 1
    }
  }
  Push-Location $RepoPath
  try {
    if ($hasPy311) { py -3.11 -m venv .venv } else { python -m venv .venv }
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path .venv)) { throw "venv create failed" }
    & .\.venv\Scripts\Activate.ps1
    python -m pip install -U pip setuptools wheel
    python -m pip install -r $ReqFile || throw "Pip install failed"
    Write-Host "Done. Activate next time with: `"$RepoPath\.venv\Scripts\Activate.ps1`"" -ForegroundColor Yellow
  } finally { Pop-Location }
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
  Install-With-Venv -RepoPath $RepoPath -ReqFile $req
}

Write-Host "Environment setup complete." -ForegroundColor Cyan
