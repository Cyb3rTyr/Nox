// pages/vault.js

// Internal vault state
let vaultData = null;
let masterKey = null;

export async function init() {
    const vaultPage = document.getElementById('vault-container');
    // Assuming vault is reused or you create a #vault page
    vaultPage.innerHTML = `
        <div id="vault-lock-screen">
            <h2>🔒 Vault Locked</h2>
            <input type="password" id="vault-password" placeholder="Enter Master Password" />
            <button id="unlockVault" class="action">Unlock Vault</button>
            <div id="vault-error" class="loading hidden">Invalid password</div>
        </div>
        <div id="vault-content" class="hidden">
            <button id="lockVault" class="action">Lock Vault</button>
            <h2>Vault Contents</h2>
            <div id="vault-files"></div>
            <input type="file" id="vault-file-upload" multiple style="margin-top: 20px;"/>
        </div>
    `;

    document.getElementById('unlockVault').addEventListener('click', unlockVault);
    document.getElementById('lockVault').addEventListener('click', lockVault);
    document.getElementById('vault-file-upload').addEventListener('change', handleFileUpload);

    console.log('Vault JS loaded!');
}

async function unlockVault() {
    const password = document.getElementById('vault-password').value;
    masterKey = await deriveKey(password);

    const vaultLoaded = await loadVault();

    if (!vaultLoaded) {
        // 🆕 First time setup
        vaultData = {
            files: [],
            folders: [],
            passwords: []
        };
        await saveVault(); // 🔥 Create initial vault.dat
    }

    document.getElementById('vault-lock-screen').classList.add('hidden');
    document.getElementById('vault-content').classList.remove('hidden');
    renderVault();
}


async function lockVault() {
    vaultData = null;
    masterKey = null;
    document.getElementById('vault-content').classList.add('hidden');
    document.getElementById('vault-lock-screen').classList.remove('hidden');
}

async function handleFileUpload(event) {
    const files = event.target.files;
    for (const file of files) {
        const filePath = `/vault/files/${file.name}`;
        await saveFileLocally(filePath, file);
        vaultData.files.push({ name: file.name, path: filePath });
    }
    await saveVault();
    renderVault();
}

function renderVault() {
    const container = document.getElementById('vault-files');
    container.innerHTML = '';

    for (const file of vaultData.files) {
        const fileDiv = document.createElement('div');
        fileDiv.classList.add('vault-file-entry');

        // Show file name
        const name = document.createElement('div');
        name.textContent = file.name;
        fileDiv.appendChild(name);

        // Add a view/download button
        const btn = document.createElement('button');
        btn.textContent = 'View/Download';
        btn.classList.add('action');
        btn.addEventListener('click', async () => {
            const blob = await readFile(file.path);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
        });
        fileDiv.appendChild(btn);

        container.appendChild(fileDiv);
    }
}


async function deriveKey(password) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode('nox-vault-salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function loadVault() {
    try {
        const vaultBlob = await readFile('/vault/vault.dat');
        const data = new Uint8Array(await vaultBlob.arrayBuffer());
        const iv = data.slice(0, 12);
        const encrypted = data.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            masterKey,
            encrypted
        );

        vaultData = JSON.parse(new TextDecoder().decode(decrypted));
        return true;
    } catch (err) {
        console.error('Failed to load vault:', err);
        return false;
    }
}

async function saveVault() {
    const enc = new TextEncoder();
    const json = enc.encode(JSON.stringify(vaultData));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        masterKey,
        json
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    await saveFileLocally('/vault/vault.dat', new Blob([combined]));
}

// Placeholder file operations - replace with your real storage logic
async function readFile(path) {
    const base64 = localStorage.getItem(path);
    if (!base64) throw new Error('File not found');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes]);
}

async function saveFileLocally(path, blob) {
    const buffer = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    localStorage.setItem(path, base64);
}

