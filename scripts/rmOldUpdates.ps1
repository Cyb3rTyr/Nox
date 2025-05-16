<#
.SYNOPSIS
  Cleans old Windows Update files and component store.

.DESCRIPTION
  - (Optional) Creates a System Restore point.
  - Stops Windows Update and BITS services.
  - Runs DISM /StartComponentCleanup to remove superseded components.
  - Deletes update installers older than 6 months from SoftwareDistribution\Download,
    but only if the corresponding KB is already installed.
  - Restarts the services.

.PARAMETER CleanOldUpdates
  Switch to trigger the cleanup logic.

.PARAMETER CreateRestorePoint
  Switch to create a System Restore point before cleanup.

.EXAMPLE
  .\Clean-OldUpdates.ps1 -CleanOldUpdates -CreateRestorePoint
#>

[CmdletBinding()]
Param(
    [Switch]$CleanOldUpdates,
    [Switch]$CreateRestorePoint
)

function Create-RestorePoint {
    Param([string]$Description = "Pre-UpdateCleanup")
    Write-Host "Creating system restore point..." -ForegroundColor Cyan
    try {
        Checkpoint-Computer -Description $Description -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
        Write-Host "  ✓ Restore point created." -ForegroundColor Green
    }
    catch {
        Write-Warning "  ✗ Failed to create restore point: $_"
    }
}

if ($CleanOldUpdates) {
    if ($CreateRestorePoint) {
        # Only works in Windows PowerShell (not Core)
        if ($PSVersionTable.PSEdition -eq 'Desktop') {
            Create-RestorePoint
        }
        else {
            Write-Warning "Restore points require Windows PowerShell Desktop edition."
        }
    }

    Write-Host "`nStopping Windows Update services…" -ForegroundColor Cyan
    Stop-Service -Name wuauserv, bits -Force -ErrorAction SilentlyContinue

    Write-Host "`nRunning DISM component-store cleanup…" -ForegroundColor Cyan
    $dismArgs = '/Online', '/Cleanup-Image', '/StartComponentCleanup', '/Quiet', '/NoRestart'
    Start-Process -FilePath dism.exe -ArgumentList $dismArgs -Wait -NoNewWindow
    Write-Host "  ✓ DISM cleanup complete." -ForegroundColor Green

    Write-Host "`nPruning old installers from download cache…" -ForegroundColor Cyan
    $sixMonthsAgo = (Get-Date).AddMonths(-6)
    $downloadCache = Join-Path $env:WINDIR 'SoftwareDistribution\Download'
    $installedKBs = Get-HotFix | Select-Object -ExpandProperty HotFixID

    if (Test-Path $downloadCache) {
        # Initialize removal counter
        $removedCount = 0

        Get-ChildItem -Path $downloadCache -Recurse -File |
        Where-Object {
            $_.LastWriteTime -lt $sixMonthsAgo -and
            ($installedKBs -contains ([regex]::Match($_.Name, 'KB\d+')).Value)
        } |
        ForEach-Object {
            try {
                Remove-Item $_.FullName -Force -ErrorAction Stop
                Write-Host "    Removed: $($_.Name)" -ForegroundColor Gray
                # Increment counter
                $removedCount++
            }
            catch {
                Write-Warning "    Failed to remove $($_.Name): $_"
            }
        }

        # Summary of removals
        Write-Host "  ✓ Download cache pruning complete. Removed $removedCount file(s)." -ForegroundColor Green
    }
    else {
        Write-Warning "Download cache not found: $downloadCache"
    }

    Write-Host "`nRestarting Windows Update services…" -ForegroundColor Cyan
    Start-Service -Name wuauserv, bits
    Write-Host "  ✓ Services restarted." -ForegroundColor Green

    Write-Host "`nOld-update cleanup finished." -ForegroundColor Yellow
}
else {
    Write-Host "Nothing to do. Use the –CleanOldUpdates switch to run cleanup." -ForegroundColor Yellow
}
