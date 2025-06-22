# 🛡️ Malware Defense (Defender)

This tool provides quick access to essential Windows Defender operations for system protection.

---

### 🧰 Available Actions

| Action                  | Description                                              |
|--------------------------|----------------------------------------------------------|
| `Quick Scan`             | Scans common malware locations (fast)                    |
| `Full Scan`              | Thoroughly scans all files and drives                    |
| `Scan Folder…`           | Allows scanning a specific folder of your choice         |

---

### ⚙ Behind the Scenes

- Powered by **Windows Defender** via PowerShell commands.
- All scans use `Start-MpScan` with appropriate parameters.
- Real-time protection is toggled using `Set-MpPreference`.

---

### ⚠ Notes

- Requires Defender to be enabled on the system.
- Folder scans work only when a valid folder is selected.

