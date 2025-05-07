<#
.SYNOPSIS
  Scan common junk folders and report file & folder counts.

.DESCRIPTION
  Recursively counts files and directories in:
    • Downloads
    • User Temp
    • System Temp
    • Windows Update cache

  Then prints per-folder counts and a grand total.
#>

param(
    [switch]$Scan
)

if (-not $Scan) {
    Write-Error "Usage: .\systemCleanup.ps1 -Scan"
    exit 1
}

# Define your targets
$folders = @{
    'Downloads'     = "$env:USERPROFILE\Downloads"
    'Temp (User)'   = "$env:TEMP"
    'Temp (System)' = "$env:WINDIR\Temp"
    'Old Updates'   = "$env:WINDIR\SoftwareDistribution\Download"
}

$totalFiles   = 0
$totalFolders = 0

foreach ($name in $folders.Keys) {
    $path = $folders[$name]
    if (Test-Path $path) {
        # Count files
        $files = Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue
        $fileCount = $files.Count

        # Count directories
        $dirs  = Get-ChildItem -Path $path -Recurse -Directory -ErrorAction SilentlyContinue
        $dirCount = $dirs.Count

        Write-Output ("{0}: {1} files, {2} folders" -f $name, $fileCount, $dirCount)

        $totalFiles   += $fileCount
        $totalFolders += $dirCount
    }
    else {
        Write-Output ("{0}: Path not found: {1}" -f $name, $path)
    }
}

Write-Output ("Total: {0} files, {1} folders" -f $totalFiles, $totalFolders)
