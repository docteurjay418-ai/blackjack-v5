$desktop = [Environment]::GetFolderPath('Desktop')
$root = Resolve-Path .
$open = Join-Path $root 'open-index.ps1'
if (-not (Test-Path $open)) { Write-Error "Script introuvable: $open"; exit 1 }

$shortcutPath = Join-Path $desktop 'Blackjack v5.lnk'
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($shortcutPath)
$sc.TargetPath = 'powershell.exe'
$sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$open`""
$sc.WorkingDirectory = "$root"
$sc.IconLocation = "$env:SystemRoot\System32\imageres.dll,109"
$sc.Save()

Write-Host "Raccourci créé: $shortcutPath" -ForegroundColor Green

