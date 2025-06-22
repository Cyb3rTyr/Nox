<p align="center"><img src="https://github.com/user-attachments/assets/32da8790-83e4-400c-830e-fcb82886eeb5" alt="Nox Logo" width="320" /></p>


# Nox

**Nox** is a lightweight Windows desktop utility built with Electron. It consolidates essential system maintenance tools in one neat package:

- 🛡️ **Malware Defense**: On-demand and real-time scanning powered by Windows Defender.  
- 🧹 **System Cleanup**: Clean temporary files, downloads, old updates, and empty the Recycle Bin via PowerShell scripts.  
- 📊 **System Health Dashboard**: Live CPU, RAM, and disk usage; OS info; uptime, using the `systeminformation` Node module.  
- 🌐 **URL Scanner**: Quickly check URLs against VirusTotal.  
- ✉️ **Contact Support**: One-click to open your default mail client or web-mail compose.  

---

## 📥 Installation

1. **Download the latest installer** from the [Releases page](https://github.com/Cyb3rTyr/Nox/releases).  
2. Run `Nox-Setup-<version>.exe` and follow the wizard (you can change the install directory).  
3. Launch **Nox** from the Windows Start Menu.

> **Note:** If Nox is already running, close it before retrying the installer.

---

## 🏗️ Development Setup

**Prerequisites:**
- Node.js v18+ and npm  
- Git

```bash
# 1. Clone the repo
git clone https://github.com/Cyb3rTyr/Nox.git
cd Nox

# 2. Install dependencies
npm install

# 3. Run in development mode
npm start
