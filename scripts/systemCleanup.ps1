<#
.SYNOPSIS
  Scan junk folders, print a table, then optionally export *only* the totals to CSV.

.PARAMETER Scan
  Perform the scan.

.PARAMETER ExportCsv
  If present, exports the summary totals to cleanup-totals.csv in the script folder.

.EXAMPLE
  .\systemCleanup.ps1 -Scan
  # Just prints the table and total.

.EXAMPLE
  .\systemCleanup.ps1 -Scan -ExportCsv
  # Prints the table, total, and writes/creates cleanup-totals.csv.
#>

param(
    [switch]$Scan,
    [switch]$ExportCsv
)

if (-not $Scan) {
    Write-Error "Usage: .\systemCleanup.ps1 -Scan [-ExportCsv]"
    exit 1
}

# 1) Define your target folders
$folders = @{
    'Downloads'     = "$env:USERPROFILE\Downloads"
    'Temp (User)'   = "$env:TEMP"
    'Temp (System)' = "$env:WINDIR\Temp"
    'Old Updates'   = "$env:WINDIR\SoftwareDistribution\Download"
}

# Prepare for progress reporting
$totalToProcess = $folders.Count
$currentIndex = 0

# 2) Collect per‑folder counts with progress
$report = foreach ($name in $folders.Keys) {
    $currentIndex++
    $percent = [int](($currentIndex / $totalToProcess) * 100)
    Write-Progress -Activity "Scanning junk folders" `
        -Status "Processing $name ($currentIndex of $totalToProcess)" `
        -PercentComplete $percent

    $path = $folders[$name]
    $files = 0; $dirs = 0
    if (Test-Path $path) {
        $files = (Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue).Count
        $dirs = (Get-ChildItem -Path $path -Recurse -Directory -ErrorAction SilentlyContinue).Count
    }
    [PSCustomObject]@{
        Folder  = $name
        Files   = $files
        Folders = $dirs
    }
}
# Clear the progress bar
Write-Progress -Activity "Scanning junk folders" -Completed

# 3) Print the ASCII table
$report | Format-Table -AutoSize

# 4) Compute totals
$totalFiles = ($report | Measure-Object Files   -Sum).Sum
$totalFolders = ($report | Measure-Object Folders -Sum).Sum

Write-Host ''
Write-Host ("Total: {0} files, {1} folders" -f $totalFiles, $totalFolders)

# Build the summary object *before* exporting
$summary = [PSCustomObject]@{
    Timestamp    = (Get-Date).ToString("MMM dd, yyyy HH:mm:ss")
    TotalFiles   = $totalFiles
    TotalFolders = $totalFolders
}

# 5) If requested, export *only* the totals to CSV in a 'reports' subfolder
if ($ExportCsv) {
    $reportsDir = Join-Path -Path $PSScriptRoot -ChildPath 'reports'
    if (-not (Test-Path $reportsDir)) {
        New-Item -Path $reportsDir -ItemType Directory | Out-Null
    }

    $csvPath = Join-Path -Path $reportsDir -ChildPath 'cleanup-totals.csv'

    if (Test-Path $csvPath) {
        # load existing into an array, append the summary, keep only last 7
        $existing = @( Import-Csv -Path $csvPath )
        $existing += $summary
        $existing | Select-Object -Last 7 |
        Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8 -Force
    }
    else {
        # first run: create file with header + row
        $summary | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
    }
}
