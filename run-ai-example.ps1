param(
  [string]$EnvName = "bj-tf",
  [string]$RepoPath
)

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $RepoPath) { $RepoPath = Join-Path $here 'Artificial-Intelligence-in-BlackJack-Card-Counting' }
$example = Join-Path $RepoPath 'example.py'
if (-not (Test-Path $example)) { Write-Error "example.py introuvable: $example"; exit 1 }

function Run-Conda {
  param([string]$Env,[string]$Script)
  Write-Host "Utilisation conda env '$Env'" -ForegroundColor Green
  conda run -n $Env python -m pip -V | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Environnement conda '$Env' introuvable" }
  conda run -n $Env python $Script
}

function Run-Venv {
  param([string]$Repo,[string]$Script)
  $venv = Join-Path $Repo '.venv'
  $act = Join-Path $venv 'Scripts\Activate.ps1'
  if (-not (Test-Path $act)) { throw "Venv introuvable: $venv" }
  Write-Host "Utilisation venv: $venv" -ForegroundColor Green
  & $act
  python $Script
}

try {
  $condaVersion = conda --version 2>$null
  if ($LASTEXITCODE -eq 0) {
    Run-Conda -Env $EnvName -Script $example
    exit $LASTEXITCODE
  } else { throw "conda non détecté" }
}
catch {
  try {
    Run-Venv -Repo $RepoPath -Script $example
  }
  catch {
    Write-Warning "Aucun environnement détecté. Exécution du setup…"
    & (Join-Path $here 'setup-ai-env.ps1') -EnvName $EnvName -RepoPath $RepoPath
    if ($LASTEXITCODE -ne 0) { exit 1 }
    try {
      $condaVersion = conda --version 2>$null
      if ($LASTEXITCODE -eq 0) { Run-Conda -Env $EnvName -Script $example }
      else { Run-Venv -Repo $RepoPath -Script $example }
    } catch { exit 1 }
  }
}

