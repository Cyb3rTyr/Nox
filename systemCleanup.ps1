<#
.SYNOPSIS
  Scan common junk folders and report file & folder counts as a table.

.DESCRIPTION
  Recursively counts files and directories in:
    • Downloads
    • User Temp
    • System Temp
    • Windows Update cache

  Then prints a formatted table, followed by a total line.
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

$totalFiles = 0
$totalFolders = 0

# Collect results into objects
$report = foreach ($name in $folders.Keys) {
    $path = $folders[$name]
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue
        $dirs = Get-ChildItem -Path $path -Recurse -Directory -ErrorAction SilentlyContinue

        $fileCount = $files.Count
        $dirCount = $dirs.Count

        $totalFiles += $fileCount
        $totalFolders += $dirCount

        [PSCustomObject]@{
            Folder  = $name
            Files   = $fileCount
            Folders = $dirCount
        }
    }
    else {
        [PSCustomObject]@{
            Folder  = $name
            Files   = 'N/A'
            Folders = 'N/A'
        }
    }
}

# Output the table
$report | Format-Table -AutoSize

# Blank line, then totals
Write-Host ''
Write-Host ("Total: {0} files, {1} folders" -f $totalFiles, $totalFolders)
