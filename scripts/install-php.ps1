# Installs official portable PHP locally; XAMPP and global PATH remain unchanged.
$ErrorActionPreference = 'Stop'
$projectDir = Split-Path $PSScriptRoot -Parent
$toolsDir = Join-Path $projectDir '.tools'
$phpDir = Join-Path $toolsDir 'php'
if (Test-Path (Join-Path $phpDir 'php.exe')) {
    Write-Output 'Portable PHP is already installed.'
    exit 0
}
New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
$release = (Invoke-RestMethod 'https://downloads.php.net/~windows/releases/releases.json').'8.4'.'nts-vs17-x64'.zip
$archive = Join-Path $toolsDir 'php.zip'
Invoke-WebRequest ('https://downloads.php.net/~windows/releases/' + $release.path) -OutFile $archive
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $release.sha256) {
    throw 'The PHP download checksum does not match.'
}
Expand-Archive -LiteralPath $archive -DestinationPath $phpDir -Force
$ini = Get-Content (Join-Path $phpDir 'php.ini-development') -Raw
$extensionPath = (Join-Path $phpDir 'ext').Replace('\', '/')
$ini = $ini.Replace(';extension_dir = "ext"', ('extension_dir = "' + $extensionPath + '"'))
foreach ($extension in @('curl', 'fileinfo', 'mbstring', 'openssl', 'pdo_pgsql', 'pgsql', 'zip')) {
    $ini = $ini.Replace(";extension=$extension", "extension=$extension")
}
Set-Content -LiteralPath (Join-Path $phpDir 'php.ini') -Value $ini
& (Join-Path $phpDir 'php.exe') --version
