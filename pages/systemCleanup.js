export function init() {
  const container = document.getElementById('system-cleanup');
  container.innerHTML = `
    <!-- ─── HEADER + INFO BUTTON ─────────────────────────── -->
    <div class="cleanup-header">
      <div class="header-text">
        <h1>🧹 System Cleanup</h1>
        <p>Free up disk space and improve performance by cleaning junk files.</p>
      </div>
      <button id="sc-info" class="info-btn" title="About System Cleanup">ℹ️</button>
    </div>

    <!-- ─── ACTION CONTROLS ───────────────────────────────── -->
    <div class="controls">
      <button id="sc-scan"     class="action">Scan</button>
      <button id="sc-cleanAll" class="action">Clean All Files</button>
      <button id="sc-emptyBin" class="action">Empty Recycle Bin</button>
      <button id="sc-cleanDl"  class="action">Clean Download Folder</button>
      <button id="sc-cleanTmp" class="action">Clean Temp Folders</button>
    </div>

    <!-- ─── EXISTING RESULTS MODAL ───────────────────────── -->
    <div id="sc-modal" class="modal hidden">
      <div class="modal-content">
        <button id="sc-modal-close" class="modal-close">&times;</button>
        <h2 id="sc-modal-title">Working…</h2>
        <div id="sc-modal-progress-container" class="modal-progress-container hidden">
          <div id="sc-modal-progress-bar" class="modal-progress-bar"></div>
        </div>
        <pre id="sc-modal-output"></pre>
        <button id="sc-modal-cancel" class="modal-cancel">Cancel</button>
      </div>
    </div>

    <!-- ─── INFO POPUP MODAL ─────────────────────────────── -->
    <div id="sc-info-modal" class="info-modal">
      <div class="info-modal-content">
        <button class="close" title="Close">&times;</button>
        <pre id="sc-info-text"></pre>
      </div>
    </div>
  `;

  // grab the elements
  const btnInfo = document.getElementById('sc-info');
  const infoModal = document.getElementById('sc-info-modal');
  const infoText = document.getElementById('sc-info-text');
  const infoClose = infoModal.querySelector('.close');

  btnInfo.addEventListener('click', () => {
    fetch('InfoBox/systemCleanUp.txt')
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(txt => {
        infoText.textContent = txt;
        infoModal.classList.add('visible');
      })
      .catch(() => {
        infoText.textContent = 'Failed to load info.';
        infoModal.classList.add('visible');
      });
  });

  infoClose.addEventListener('click', () => {
    infoModal.classList.remove('visible');
  });

  // close if you click outside the content box
  infoModal.addEventListener('click', e => {
    if (e.target === infoModal) {
      infoModal.classList.remove('visible');
    }
  });


  const btns = {
    scan: document.getElementById('sc-scan'),
    cleanAll: document.getElementById('sc-cleanAll'),
    emptyBin: document.getElementById('sc-emptyBin'),
    cleanDl: document.getElementById('sc-cleanDl'),
    cleanTmp: document.getElementById('sc-cleanTmp'),
  };
  const modal = document.getElementById('sc-modal');
  const titleEl = document.getElementById('sc-modal-title');
  const progCt = document.getElementById('sc-modal-progress-container');
  const progBar = document.getElementById('sc-modal-progress-bar');
  const outputEl = document.getElementById('sc-modal-output');
  const btnCancel = document.getElementById('sc-modal-cancel');
  const btnClose = document.getElementById('sc-modal-close');

  const cleanup = window.cleanupBridge;

  // Close & Cancel handlers
  btnClose.addEventListener('click', () => modal.classList.add('hidden'));
  btnCancel.addEventListener('click', () => {
    btnCancel.disabled = true;
    cleanup.cancel?.();
  });

  // Listen for progress events
  cleanup.onProgress(pct => {
    progCt.classList.remove('hidden');
    progBar.style.width = pct + '%';
  });

  // Core runner
  async function run(action, label) {
    Object.values(btns).forEach(b => b.disabled = true);

    titleEl.textContent = label;
    outputEl.textContent = '';
    progBar.style.width = '0%';
    progCt.classList.remove('hidden');
    btnCancel.disabled = false;
    btnCancel.style.display = 'inline-block';
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
      progCt.classList.add('hidden');
      btnCancel.style.display = 'none';
      btnClose.style.display = 'inline-block';
      Object.values(btns).forEach(b => b.disabled = false);
    }
  }

  // Button bindings
  btns.scan.addEventListener('click', () => run('scan', 'Scanning for junk…'));
  btns.cleanAll.addEventListener('click', () => run('cleanAll', 'Cleaning everything…'));
  btns.emptyBin.addEventListener('click', () => run('emptyRecycleBin', 'Emptying Recycle Bin…'));
  btns.cleanDl.addEventListener('click', () => run('cleanDownloads', 'Emptying Downloads…'));
  btns.cleanTmp.addEventListener('click', () => run('cleanTemp', 'Cleaning Temp…'));
}
