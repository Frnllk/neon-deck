# Packs the extension into dist/neon-deck.zip (manifest at the zip root).
# Builds the archive with .NET ZipArchive and forward-slash entry names:
# Compress-Archive (PS 5.1) writes backslashes and Windows tar.exe writes a zip
# the AMO validator reports as corrupt.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$items = 'manifest.json', 'newtab.html', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'css', 'js', 'fonts', 'icons'
New-Item -ItemType Directory -Force dist | Out-Null
$out = Join-Path $PSScriptRoot 'dist\neon-deck.zip'
if (Test-Path $out) { Remove-Item $out }

$root = (Get-Location).Path.TrimEnd('\') + '\'
$zip = [System.IO.Compression.ZipFile]::Open($out, 'Create')
try {
  foreach ($item in $items) {
    $files = if (Test-Path $item -PathType Container) { Get-ChildItem $item -Recurse -File } else { Get-Item $item }
    foreach ($f in $files) {
      $name = $f.FullName.Substring($root.Length).Replace('\', '/')
      [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $name, 'Optimal')
    }
  }
} finally { $zip.Dispose() }
Write-Host "OK -> $out"
