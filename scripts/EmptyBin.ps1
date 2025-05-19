<#
.SYNOPSIS
  Empties the Recycle Bin and reports free-space before, after, and the reclaimed difference.
#>

[CmdletBinding()]
param()

function Get-FreeSpaceGB {
  # returns total free space on all fixed drives, in GB (rounded to 2 decimals)
  $bytes = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" |
  Measure-Object -Property FreeSpace -Sum |
  Select-Object -ExpandProperty Sum
  return [math]::Round($bytes / 1GB, 2)
}

# 1) Measure before
$before = Get-FreeSpaceGB
Write-Host ("Free space before : {0:N2} GB" -f $before)

# 2) Empty the Recycle Bin
Write-Host "Emptying Recycle Bin..." -NoNewline
try {
  Clear-RecycleBin -Force -ErrorAction Stop
  Write-Host " Done.`n"
}
catch {
  Write-Host "`nERROR emptying Recycle Bin:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

# 3) Measure after
$after = Get-FreeSpaceGB
Write-Host ("Free space after  : {0:N2} GB`n" -f $after)

# 4) Print summary
$difference = [math]::Round($after - $before, 2)
Write-Host ("Summary: Old ({0:N2} GB) → New ({1:N2} GB) = Freed {2:N2} GB" `
    -f $before, $after, $difference)
