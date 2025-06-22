; installer.nsh — kills any running Nox.exe before unpacking

!macro customInit
  ; Check for Nox.exe in the old install path and kill it if found
  StrCpy $0 "$INSTDIR\\Nox.exe"
  IfFileExists $0 0 noRunning
    DetailPrint "Found running Nox; attempting to close it..."
    ExecWait 'taskkill /F /IM Nox.exe'
    Sleep 500
  noRunning:
!macroEnd
