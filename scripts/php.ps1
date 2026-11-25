param([Parameter(ValueFromRemainingArguments=$true)][string[]]$PhpArguments)
# Prefer the ignored project runtime over an older XAMPP installation.
$projectDir = Split-Path $PSScriptRoot -Parent
$portablePhp = Join-Path $projectDir '.tools\php\php.exe'
if (Test-Path -LiteralPath $portablePhp) { $phpExecutable = $portablePhp }
else {
    $command = Get-Command php -ErrorAction SilentlyContinue
    if (!$command) { throw 'Install PHP 8.4+ or run scripts/install-php.ps1.' }
    $phpExecutable = $command.Source
}
& $phpExecutable @PhpArguments
exit $LASTEXITCODE
