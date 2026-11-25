# Starts Laravel only. PostgreSQL and Vite run separately.
$projectDir = Split-Path $PSScriptRoot -Parent
Push-Location (Join-Path $projectDir 'backend')
try { & (Join-Path $PSScriptRoot 'php.ps1') artisan serve --host=127.0.0.1 --port=8001 }
finally { Pop-Location }
