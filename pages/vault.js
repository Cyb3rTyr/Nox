export async function init() {
    const vaultContainer = document.getElementById('vault-container');
    vaultContainer.innerHTML = `
        <div class="vault-controls">
            <button id="addFolderBtn" class="action">Add Folder</button>
        </div>
        <div id="vaultFolders" class="vault-folder-list"></div>
    `;

    const folderList = document.getElementById('vaultFolders');
    const addFolderBtn = document.getElementById('addFolderBtn');

    async function renderFolders() {
        const folders = await window.noxAPI.listVaultFolders();
        folderList.innerHTML = '';

        for (const folderName of folders) {
            const files = await window.noxAPI.listFolderFiles(folderName);

            const folderDiv = document.createElement('div');
            folderDiv.className = 'vault-folder';

            folderDiv.innerHTML = `
                <div class="folder-header">
                    <h3>${folderName}</h3>
                    <button class="delete-folder">❌</button>
                </div>
                <div class="folder-files" data-folder="${folderName}">
                    ${files.map(file => `<div class="file-entry">📄 ${file}</div>`).join('')}
                    <div class="dropzone">+ Drag & Drop files here</div>
                </div>
            `;

            folderDiv.querySelector('.delete-folder').addEventListener('click', async () => {
                const confirmDelete = confirm(`Are you sure you want to permanently delete "${folderName}"?`);
                if (confirmDelete) {
                    const success = await window.noxAPI.deleteFolder(folderName);
                    if (success) renderFolders();
                }
            });

            const dropzone = folderDiv.querySelector('.dropzone');
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                const items = Array.from(e.dataTransfer.files);
                for (const item of items) {
                    await window.noxAPI.copyFileToFolder(item.path, folderName);
                }
                renderFolders();
            });

            folderList.appendChild(folderDiv);
        }
    }

    addFolderBtn.addEventListener('click', async () => {
        await window.noxAPI.addFolderToVault();
        renderFolders();
    });

    renderFolders();
}
