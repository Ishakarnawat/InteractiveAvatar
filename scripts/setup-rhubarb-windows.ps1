<#
setup-rhubarb-windows.ps1
Download and install Rhubarb Lip-Sync executable into apps/backend/bin on Windows.
Requires: PowerShell 5+ (Windows 10+) with Expand-Archive and Invoke-RestMethod.

Usage (PowerShell):
  .\scripts\setup-rhubarb-windows.ps1

Optional environment variables:
  RHUBARB_URL - full direct URL to a release asset (useful if automatic detection fails)
  DEST_DIR   - destination directory (defaults to ./apps/backend/bin)
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest

$ScriptRoot = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$RepoRoot = Resolve-Path "$ScriptRoot\.." | Resolve-Path | Select-Object -ExpandProperty Path
$DestDir = $env:DEST_DIR
if ([string]::IsNullOrWhiteSpace($DestDir)) { $DestDir = Join-Path $RepoRoot 'apps\backend\bin' }

if (-not (Test-Path $DestDir)) { New-Item -ItemType Directory -Path $DestDir -Force | Out-Null }

Write-Host "Destination: $DestDir"

# GitHub API URL for latest release
$ApiUrl = 'https://api.github.com/repos/DanielSWolf/rhubarb-lip-sync/releases/latest'

try {
    if (-not (Get-Command Invoke-RestMethod -ErrorAction SilentlyContinue)) {
        Write-Error "Invoke-RestMethod is not available in this PowerShell environment."
        exit 1
    }

    Write-Host 'Fetching latest release metadata...'
    $release = Invoke-RestMethod -Uri $ApiUrl -UseBasicParsing
} catch {
    Write-Error "Failed to fetch release metadata: $_"
    exit 1
}

# Allow override with RHUBARB_URL env var
$assetUrl = $env:RHUBARB_URL
if ([string]::IsNullOrWhiteSpace($assetUrl)) {
    # Try to find a Windows asset: look for .exe or windows in the name
    $assets = $release.assets
    $asset = $null

    # prefer assets with windows token and exe or zip
    $asset = $assets | Where-Object { ($_.browser_download_url -match '(?i)windows') -and ($_.browser_download_url -match '(?i)zip|exe') } | Select-Object -First 1
    if (-not $asset) {
        # fallback: any asset containing 'rhubarb' and 'windows' or '.exe'
        $asset = $assets | Where-Object { ($_.browser_download_url -match '(?i)rhubarb') -and ($_.browser_download_url -match '(?i)zip|exe') } | Select-Object -First 1
    }

    if (-not $asset) {
        Write-Error 'Could not determine a Windows-compatible Rhubarb asset from the latest release metadata. You can set RHUBARB_URL to a direct download URL.'
        exit 1
    }

    $assetUrl = $asset.browser_download_url
}

Write-Host "Downloading asset: $assetUrl"

# Prepare temp paths
$tempDir = New-Item -ItemType Directory -Path (Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString()))
$zipPath = Join-Path $tempDir.FullName 'rhubarb.zip'

try {
    Invoke-WebRequest -Uri $assetUrl -OutFile $zipPath -UseBasicParsing
} catch {
    Write-Error "Download failed: $_"
    exit 1
}

# If the asset is an EXE directly, try to copy it
if ($assetUrl -match '\.exe($|\?)') {
    Write-Host 'Asset is an executable; copying to destination.'
    $exeName = 'rhubarb.exe'
    $outPath = Join-Path $DestDir $exeName
    try {
        Copy-Item -Path $zipPath -Destination $outPath -Force
        Write-Host "Installed: $outPath"
        exit 0
    } catch {
        Write-Error "Failed to copy executable: $_"
        exit 1
    }
}

# Otherwise assume a ZIP and extract
Write-Host 'Extracting archive...'
$extractDir = Join-Path $tempDir.FullName 'extract'
New-Item -ItemType Directory -Path $extractDir | Out-Null

try {
    Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force
} catch {
    Write-Error "Failed to extract archive: $_"
    Get-ChildItem -Path $tempDir.FullName -Recurse | ForEach-Object { Write-Host $_.FullName }
    exit 1
}

# Find rhubarb.exe inside extracted files
$found = Get-ChildItem -Path $extractDir -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^rhubarb(\.exe)?$' } | Select-Object -First 1
if (-not $found) {
    Write-Error 'Could not find rhubarb.exe inside the extracted archive.'
    Get-ChildItem -Path $extractDir -Recurse | ForEach-Object { Write-Host $_.FullName }
    exit 1
}

$outPath = Join-Path $DestDir 'rhubarb.exe'
Copy-Item -Path $found.FullName -Destination $outPath -Force

Write-Host "Rhubarb installed to: $outPath"

# Clean up
Remove-Item -Recurse -Force -Path $tempDir.FullName

Write-Host 'Done. You can set RHUBARB_PATH to this executable if desired.'

exit 0
