const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1300,           // Default window size
        height: 800,
        minWidth: 1300,         // 👈 Minimum width
        minHeight: 800,        // 👈 Minimum height
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // if using preload
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // Optional: Open DevTools on launch
    // win.webContents.openDevTools();
}

// Ready to launch
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
