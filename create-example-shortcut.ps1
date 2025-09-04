$desktop = [Environment]::GetFolderPath('Desktop')
$root = Resolve-Path .
$targetPs1 = Join-Path $root 'run-ai-example.ps1'
if (-not (Test-Path $targetPs1)) { Write-Error "Script introuvable: $targetPs1"; exit 1 }

$shortcutPath = Join-Path $desktop 'Run Blackjack AI Example.lnk'
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($shortcutPath)
$sc.TargetPath = 'powershell.exe'
$sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$targetPs1`""
$sc.WorkingDirectory = "$root"
$sc.IconLocation = "$env:SystemRoot\System32\imageres.dll,109"
$sc.Save()

Write-Host "Raccourci créé: $shortcutPath" -ForegroundColor Green

