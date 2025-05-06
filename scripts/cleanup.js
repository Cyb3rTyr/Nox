#!/usr/bin/env node
/**
 * cleanup.js
 * 
 * Actions:
 *  - scan: report counts & sizes of junk dirs
 *  - cleanAll: perform all clean actions
 *  - cleanOldUpdates: clear Windows Update cache
 *  - cleanDownloads: empty %USERPROFILE%/Downloads
 *  - cleanTemp: empty system temp folders
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const homedir = os.homedir();
const downloadsDir = path.join(homedir, 'Downloads');
const winTemp = path.join(process.env.SYSTEMROOT || 'C:\\Windows', 'Temp');
const userTemp = os.tmpdir();
const winUpdateCache = path.join(process.env.SYSTEMROOT || 'C:\\Windows', 'SoftwareDistribution', 'Download');

async function getDirInfo(dir) {
    let totalSize = 0, fileCount = 0;
    async function walk(d) {
        const entries = await fs.promises.readdir(d, { withFileTypes: true });
        for (const e of entries) {
            const full = path.join(d, e.name);
            if (e.isDirectory()) {
                await walk(full);
            } else {
                fileCount++;
                const { size } = await fs.promises.stat(full);
                totalSize += size;
            }
        }
    }
    try {
        await walk(dir);
    } catch (e) { /* ignore missing or no-access */ }
    return { fileCount, totalSize };
}

async function emptyDir(dir) {
    try {
        const entries = await fs.promises.readdir(dir);
        await Promise.all(entries.map(name =>
            fs.promises.rm(path.join(dir, name), { recursive: true, force: true })
        ));
        console.log(`✅ Emptied: ${dir}`);
    } catch (e) {
        console.error(`⚠️ Failed to empty ${dir}: ${e.message}`);
    }
}

async function cleanOldUpdates() {
    console.log(`— Cleaning Windows Update cache at ${winUpdateCache}`);
    await emptyDir(winUpdateCache);
}

async function scanAll() {
    console.log('— Scanning all targets...');
    for (const [name, dir] of [
        ['Downloads', downloadsDir],
        ['User Temp', userTemp],
        ['Windows Temp', winTemp],
        ['WinUpdate Cache', winUpdateCache],
    ]) {
        const info = await getDirInfo(dir);
        console.log(`${name}: ${info.fileCount} files, ${(info.totalSize / 1024 / 1024).toFixed(1)} MB`);
    }
}

async function main() {
    const action = process.argv[2];
    switch (action) {
        case 'scan':
            await scanAll();
            break;
        case 'cleanAll':
            console.log('— Cleaning everything...');
            await cleanOldUpdates();
            await emptyDir(downloadsDir);
            await emptyDir(userTemp);
            await emptyDir(winTemp);
            break;
        case 'cleanOldUpdates':
            await cleanOldUpdates();
            break;
        case 'cleanDownloads':
            await emptyDir(downloadsDir);
            break;
        case 'cleanTemp':
            await emptyDir(userTemp);
            await emptyDir(winTemp);
            break;
        default:
            console.error(`Unknown action: ${action}`);
            process.exit(1);
    }
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
