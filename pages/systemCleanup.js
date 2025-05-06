// pages/systemCleanup.js
export function init() {
    const container = document.getElementById('system-cleanup');
    container.innerHTML = `
      <h1>System Cleanup</h1>
      <div class="controls">
        <button id="sc-cleanAll" class="action">Clean All Files</button>
        <button id="sc-scan"      class="action">Scan</button>
        <button id="sc-cleanOld"  class="action">Clean Old Updates</button>
        <button id="sc-cleanDl"   class="action">Clean Download Folder</button>
        <button id="sc-cleanTmp"  class="action">Clean Temp Folders</button>
        <div id="sc-loader" class="loader hidden"></div>
      </div>
      <pre id="sc-output" class="health-log"></pre>
    `;

    const buttons = {
        cleanAll: document.getElementById('sc-cleanAll'),
        scan: document.getElementById('sc-scan'),
        cleanOld: document.getElementById('sc-cleanOld'),
        cleanDl: document.getElementById('sc-cleanDl'),
        cleanTmp: document.getElementById('sc-cleanTmp'),
    };
    const loader = document.getElementById('sc-loader');
    const output = document.getElementById('sc-output');

    async function run(action) {
        Object.values(buttons).forEach(b => b.disabled = true);
        loader.classList.remove('hidden');
        output.textContent = '';
        try {
            const result = await window.cleanupAPI.run(action);
            output.textContent = result;
        } catch (e) {
            output.textContent = `Error: ${e.message}`;
        }
        loader.classList.add('hidden');
        Object.values(buttons).forEach(b => b.disabled = false);
    }

    buttons.cleanAll.addEventListener('click', () => run('cleanAll'));
    buttons.scan.addEventListener('click', () => run('scan'));
    buttons.cleanOld.addEventListener('click', () => run('cleanOldUpdates'));
    buttons.cleanDl.addEventListener('click', () => run('cleanDownloads'));
    buttons.cleanTmp.addEventListener('click', () => run('cleanTemp'));
}
