<#
.SYNOPSIS
  Empties all Recycle Bins and reports free-space before, after, and the reclaimed difference.
#>

[CmdletBinding()]
param()

function Get-FreeSpaceGB {
  # Sum free bytes across all fixed (DriveType 3) disks, convert to GB
  $bytes = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" |
  Measure-Object -Property FreeSpace -Sum |
  Select-Object -ExpandProperty Sum
  return [math]::Round($bytes / 1GB, 2)
}

function Empty-AllRecycleBins {
  # Enumerate all filesystem drives and clear each bin, silencing missing-path errors
  Get-PSDrive -PSProvider FileSystem |
  ForEach-Object {
    Clear-RecycleBin -DriveLetter $_.Name -Force -ErrorAction SilentlyContinue
  }
}

# 1) Before
$before = Get-FreeSpaceGB
Write-Host ("Free space before: {0} GB" -f $before)

# 2) Empty
Empty-AllRecycleBins
Write-Host "`n"

# 3) After
$after = Get-FreeSpaceGB
Write-Host ("Free space after : {0} GB`n" -f $after)

# 4) Summary
$difference = [math]::Round($after - $before, 2)
if ($difference -ge 0) {
  Write-Host ""
  Write-Host "============================`n"
  Write-Host ("Summary: Freed {2} GB" `
      -f $before, $after, $difference)
}
else {
  # (In the unlikely case you lose free-space here)
  $used = [math]::Abs($difference)
  Write-Host ("`n Summary: Consumed {2} GB" `
      -f $before, $after, $used)
}

exit 0
