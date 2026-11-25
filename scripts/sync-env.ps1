# Copies only database settings from root .env into Laravel's ignored .env.
$ErrorActionPreference = 'Stop'
$projectDir = Split-Path $PSScriptRoot -Parent
$rootEnv = Join-Path $projectDir '.env'
$backendEnv = Join-Path $projectDir 'backend\.env'
if (!(Test-Path -LiteralPath $rootEnv)) { throw 'Create root .env from .env.example first.' }
if (!(Test-Path -LiteralPath $backendEnv)) {
    Copy-Item (Join-Path $projectDir 'backend\.env.example') $backendEnv
}
$content = Get-Content -LiteralPath $backendEnv -Raw
foreach ($line in Get-Content -LiteralPath $rootEnv) {
    if ($line -match '^(DB_DATABASE|DB_USERNAME|DB_PASSWORD|DB_PORT)=(.*)$') {
        $settingName = $Matches[1]
        $settingValue = $Matches[2]
        if ($settingName -eq 'DB_PASSWORD' -and $settingValue -eq 'replace_with_local_password') { throw 'Choose a real local password before continuing.' }
        $pattern = '(?m)^' + [regex]::Escape($settingName) + '=.*$'
        $replacement = $settingName + '=' + $settingValue
        $content = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $replacement })
    }
}
[System.IO.File]::WriteAllText($backendEnv, $content, [System.Text.UTF8Encoding]::new($false))
Write-Output 'Laravel database settings synchronized. Values were not printed.'
