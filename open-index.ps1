$root = Resolve-Path .
$index = Join-Path $root 'index.html'
if (-not (Test-Path $index)) { Write-Error "index.html not found: $index"; exit 1 }
Start-Process $index
Write-Host "Opened: $index" -ForegroundColor Green

