// pages/systemCleanup.js

export function init() {
    const container = document.getElementById('system-cleanup');

    // Inject controls + modal, with a progress bar instead of spinner
    container.innerHTML = `
      <h1>🧹 System Cleanup</h1>
      <p>Free up disk space and improve performance by cleaning junk files.</p>
      <div class="controls">
        <button id="sc-scan"     class="action">Scan</button>
        <button id="sc-cleanAll" class="action">Clean All Files</button>
        <button id="sc-cleanOld" class="action">Clean Old Updates</button>
        <button id="sc-cleanDl"  class="action">Clean Download Folder</button>
        <button id="sc-cleanTmp" class="action">Clean Temp Folders</button>
      </div>
  
      <!-- Blocking modal -->
      <div id="sc-modal" class="modal hidden">
        <div class="modal-content">
          <button id="sc-modal-close"  class="modal-close">&times;</button>
          <h2 id="sc-modal-title">Working…</h2>
  
          <!-- progress bar -->
          <div id="sc-modal-progress" class="modal-progress"></div>
  
          <pre id="sc-modal-output"></pre>
          <button id="sc-modal-cancel" class="modal-cancel">Cancel</button>
        </div>
      </div>
    `;

    // Grab elements
    const btns = {
        scan: document.getElementById('sc-scan'),
        cleanAll: document.getElementById('sc-cleanAll'),
        cleanOld: document.getElementById('sc-cleanOld'),
        cleanDl: document.getElementById('sc-cleanDl'),
        cleanTmp: document.getElementById('sc-cleanTmp'),
    };
    const modal = document.getElementById('sc-modal');
    const titleEl = document.getElementById('sc-modal-title');
    const progressBar = document.getElementById('sc-modal-progress');
    const outputEl = document.getElementById('sc-modal-output');
    const btnCancel = document.getElementById('sc-modal-cancel');
    const btnClose = document.getElementById('sc-modal-close');

    // Bridge (adapt if you named it differently)
    const cleanup = window.cleanupAPI || window.cleanupBridge;

    // Close (after done)
    btnClose.addEventListener('click', () => modal.classList.add('hidden'));

    // Cancel (during run)
    btnCancel.addEventListener('click', () => {
        btnCancel.disabled = true;
        cleanup.cancel?.();
    });

    // Core runner
    async function run(action, label) {
        // disable buttons
        Object.values(btns).forEach(b => b.disabled = true);

        // prepare modal
        titleEl.textContent = label;
        outputEl.textContent = '';
        progressBar.style.display = 'block';
        btnCancel.style.display = 'inline-block';
        btnCancel.disabled = false;
        btnClose.style.display = 'none';
        modal.classList.remove('hidden');

        try {
            const result = await cleanup.run(action);
            outputEl.textContent = result.trim();
        } catch (err) {
            outputEl.textContent =
                err.message === 'Canceled by user'
                    ? '⚠️ Operation canceled.'
                    : `❌ Error: ${err.message}`;
        } finally {
            // hide progress bar, show close
            progressBar.style.display = 'none';
            btnCancel.style.display = 'none';
            btnClose.style.display = 'inline-block';
            // re-enable buttons
            Object.values(btns).forEach(b => b.disabled = false);
        }
    }

    // Wire buttons
    btns.scan.addEventListener('click', () => run('scan', 'Scanning for junk…'));
    btns.cleanAll.addEventListener('click', () => run('cleanAll', 'Cleaning everything…'));
    btns.cleanOld.addEventListener('click', () => run('cleanOldUpdates', 'Cleaning old updates…'));
    btns.cleanDl.addEventListener('click', () => run('cleanDownloads', 'Emptying Downloads…'));
    btns.cleanTmp.addEventListener('click', () => run('cleanTemp', 'Cleaning Temp…'));
}
