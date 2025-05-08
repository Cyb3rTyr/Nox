#!/usr/bin/env node
// cleanup.js

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

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
    } catch { }
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
    const N = targets.length;
    for (let i = 0; i < N; i++) {
        const t = targets[i];
        const { files, dirs } = await countEntries(t.dir);
        totalFiles += files;
        totalDirs += dirs;
        // emit progress percentage
        const pct = Math.round(((i + 1) / N) * 100);
        console.log(`PROGRESS:${pct}`);
        // then emit the folder’s result
        console.log(`${t.name}: ${files} files, ${dirs} dirs`);
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
