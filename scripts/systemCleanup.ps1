<#
.SYNOPSIS
  Scan junk folders, empty specific locations or recycle bin.
.PARAMETER Scan
  Perform the scan and show counts.
.PARAMETER CleanDownloads
  Empty the Downloads folder.
.PARAMETER CleanTemp
  Empty both the user and system temp folders.
.PARAMETER CleanAll
  Empty Downloads + both temp folders.
.PARAMETER EmptyRecycleBin
  Empty the Windows Recycle Bin.
#>

param(
    [switch]$Scan,
    [switch]$CleanDownloads,
    [switch]$CleanTemp,
    [switch]$CleanAll,
    [switch]$CleanOldUpdates
)

function Write-Header { 
    Write-Host ""; Write-Host "── $($args[0]) ──" -ForegroundColor Cyan 
}

function Clean-Folder {
    param($Label, $Path)
    if (Test-Path $Path) {
        Write-Host "🧹 Cleaning $Label..."
        try {
            Remove-Item -Path "$Path\*" -Recurse -Force -ErrorAction Stop
            Write-Host "✅ $Label cleaned.`n"
        }
        catch {
            Write-Warning "⚠️  Failed to clean "
            Write-Host ""
        }
    }
    else {
        Write-Warning "⚠️  $Label does not exist.`n"
    }
}

# 1) SCAN
# 1) SCAN
if ($Scan) {
    Write-Host ""
    Write-Host "Starting Scan…" -ForegroundColor Cyan

    # map of label → path
    $folders = @{
        'Downloads'     = "$env:USERPROFILE\Downloads"
        'Temp (User)'   = "$env:TEMP"
        'Temp (System)' = "$env:WINDIR\Temp"
        'Recycle Bin'   = ''  # leave empty, special‐case below
    }

    # function to get recycle‐bin counts
    function Get-RecycleBinCounts {
        $shell = New-Object -ComObject Shell.Application
        $bin = $shell.Namespace(0xA)  # Recycle Bin
        $items = $bin.Items()
        [PSCustomObject]@{
            Files   = ($items | Where-Object { -not $_.IsFolder }).Count
            Folders = ($items | Where-Object { $_.IsFolder }).Count
        }
    }

    # build report
    $report = foreach ($name in $folders.Keys) {
        if ($name -eq 'Recycle Bin') {
            $counts = Get-RecycleBinCounts
            $f = $counts.Files
            $d = $counts.Folders
        }
        else {
            $p = $folders[$name]
            if (Test-Path $p) {
                $f = (Get-ChildItem -Path $p -Recurse -File   -ErrorAction SilentlyContinue).Count
                $d = (Get-ChildItem -Path $p -Recurse -Directory -ErrorAction SilentlyContinue).Count
            }
            else {
                $f = 0; $d = 0
            }
        }

        # enforce property order: Folder, Files, Folders
        [PSCustomObject]([Ordered]@{
                Folder  = $name
                Files   = $f
                Folders = $d
            })
    }

    # render the table
    $report | Format-Table -AutoSize

    # totals
    $sumFiles = ($report | Measure-Object Files   -Sum).Sum
    $sumFolders = ($report | Measure-Object Folders -Sum).Sum

    Write-Host ""
    Write-Host ("Total: {0} files, {1} folders" -f $sumFiles, $sumFolders) -ForegroundColor Green

    exit 0
}




# 2) CLEAN DOWNLOADS
if ($CleanDownloads) {
    Write-Header "Emptying Downloads"
    Clean-Folder "Downloads" "$env:USERPROFILE\Downloads"
    exit 0
}

# ── CLEAN TEMP ───────────────────────────────────────────────────
if ($CleanTemp) {
    Write‐Header "Emptying Temp (User)"
    Clean‐Folder "Temp (User)"  "$env:TEMP"
    Write‐Header "Emptying Temp (System)"
    Clean‐Folder "Temp (System)" "$env:WINDIR\Temp"
    # if you want them in one table, collect first:
    # $t = Clean‐Folder "Temp (User)" $env:TEMP, Clean‐Folder "Temp (System)" "$env:WINDIR\Temp"
    # $t | Format‐Table Folder,Files,Folders -AutoSize

    exit 0
}
# 4) CLEAN ALL
if ($CleanAll) {
    Write-Header "Emptying Downloads"
    Clean-Folder "Downloads" "$env:USERPROFILE\Downloads"
    Write-Header "Emptying Temp (User)"
    Clean-Folder "Temp (User)" "$env:TEMP"
    Write-Header "Emptying Temp (System)"
    Clean-Folder "Temp (System)" "$env:WINDIR\Temp"
    exit 0
}

# 5) EMPTY RECYCLE BIN
if ($EmptyRecycleBin) {
    Write-Header "Emptying Recycle Bin"
    try {
        Clear-RecycleBin -Force -ErrorAction Stop
        Write-Host "✅ Recycle Bin emptied."
    }
    catch {
        Write-Warning "⚠️  Failed to empty Recycle Bin: $_"
    }
    exit 0
}

# If we get here, no switch was provided
Write-Error "Usage: .\systemCleanup.ps1 -Scan | -CleanDownloads | -CleanTemp | -CleanAll | -EmptyRecycleBin"
exit 1
