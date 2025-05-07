#!/usr/bin/env node
/**
 * Usage: node systemCleanup.js scan
 * Prints for each folder: "# files, # directories"
 * Then a total line.
 */
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Recursively count files & dirs in `dir`
async function countEntries(dir) {
    let files = 0, dirs = 0;
    try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const it of items) {
            const full = path.join(dir, it.name);
            if (it.isDirectory()) {
                dirs++;
                const sub = await countEntries(full);
                files += sub.files;
                dirs += sub.dirs;
            } else if (it.isFile()) {
                files++;
            }
        }
    } catch (_) {
        // silently skip unreadable dirs
    }
    return { files, dirs };
}

async function scan() {
    const targets = [
        { name: 'Downloads', dir: path.join(os.homedir(), 'Downloads') },
        { name: 'Temp (User)', dir: os.tmpdir() },
        {
            name: 'Temp (System)', dir: process.platform === 'win32'
                ? path.join(process.env.windir || 'C:\\Windows', 'Temp')
                : '/tmp'
        },
        {
            name: 'Old Updates', dir: process.platform === 'win32'
                ? path.join(process.env.windir || 'C:\\Windows', 'SoftwareDistribution', 'Download')
                : path.join(os.homedir(), '.cache')
        },
    ];

    let totalFiles = 0, totalDirs = 0;
    for (const t of targets) {
        const { files, dirs } = await countEntries(t.dir);
        console.log(`${t.name}: ${files} files, ${dirs} dirs`);
        totalFiles += files;
        totalDirs += dirs;
    }
    console.log(`Total: ${totalFiles} files, ${totalDirs} dirs`);
}

(async () => {
    const cmd = process.argv[2];
    if (cmd === 'scan') {
        await scan();
    } else {
        console.error('Unknown action:', cmd);
        process.exit(1);
    }
})();
