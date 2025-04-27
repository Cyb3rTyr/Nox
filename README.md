<p align="center"><img src="https://github.com/user-attachments/assets/32da8790-83e4-400c-830e-fcb82886eeb5" alt="Nox Logo" width="320" /></p>


# Nox

**Nox** is a cross-platform (Windows) desktop application built with [Electron](https://www.electronjs.org/) that helps you secure, optimize, and anonymize your system. It features real-time malware defense, system cleanup, file encryption, privacy controls, and a built-in vault for sensitive files.

---

## 🚀 Features

- **Malware Defense**  
  Real-time detection and removal of malware and suspicious processes.

- **System Cleanup**  
  Scan for and remove junk files, temporary data, and unused applications.

- **Scanner**  
  Manual on-demand scans with progress indicator.

- **File Encryption**  
  Encrypt and decrypt files or folders with strong algorithms.

- **Privacy Settings**  
  Manage browser history, cookies, trackers, and telemetry.

- **System Health**  
  One-click update/upgrade of system packages via `winget`; live health logs.

- **Vault**  
  Securely import, organize, and manage sensitive folders and documents.

---

## 🛠️ Prerequisites

- **OS:** Windows 10 or later  
- **Node.js:** v14.x or newer (for building from source)  
- **npm:** v6.x or newer (for building from source)  
- **winget:** Windows Package Manager (for updates)

---

## 📥 Installation

### 1. Using the Installer (Recommended)

We provide a Windows installer (`.exe`) that bundles everything you need. After downloading:

1. Run `Nox-Setup.exe`  
2. Follow the on-screen prompts to install  
3. Launch **Nox** from your Start Menu

### 2. From Source

If you prefer to build yourself:

```bash
git clone https://github.com/Cyb3rTyr/Nox.git
cd Nox
npm install
npm start
