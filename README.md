<p align="center"><img src="https://github.com/user-attachments/assets/32da8790-83e4-400c-830e-fcb82886eeb5" alt="Nox Logo" width="320" /></p>


# Nox

**Nox** is a cross-platform (Windows) desktop application built with [Electron](https://www.electronjs.org/) that helps you secure, optimize, and anonymize your system. It features real-time malware defense, system cleanup, file encryption, privacy controls, and a built-in vault for sensitive files.

---

## 🚀 Features

- **Malware Defense**  
  As a first-year cybersecurity student without dedicated servers or a custom detection engine (yet), Nox currently leverages Windows Defender via native CLI commands. This gives you real-time monitoring, signature-based and heuristic scans (quick, full, or custom folder), automatic definition updates, quarantine with safe rollback, and customizable exclusion lists — all powered by Defender’s proven engine and without exposing users to complex settings or relying on external servers. Future releases will introduce my own detection algorithms and a standalone malware engine as my skills and resources grow.


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
