# 🧹 System Cleanup

The System Cleanup tool helps you free up disk space by removing temporary, unnecessary, or outdated files.

---

### 🧪 Available Actions

| Action                | Description                                              |
|------------------------|----------------------------------------------------------|
| `Scan`                | Analyzes your system for cleanup candidates              |
| `Clean All Files`     | Executes all cleanup tasks in one go                     |
| `Clean Recycle Bin`   | Empties the recycle bin                  |
| `Clean Download Folder` | Removes files from the default Downloads directory     |
| `Clean Temp Folder`   | Clears temporary system and user files                   |

---

### 🔄 How It Works

- Each action runs a PowerShell script behind the scenes.
- Progress is shown via a modal with a dynamic progress bar.
- Scan results and logs are displayed after completion.

---

### ⚠ Notes

- Deleted files cannot be recovered — use with care.
- Running the scan first is recommended to preview cleanup size.
- Some operations may require administrator permissions.
