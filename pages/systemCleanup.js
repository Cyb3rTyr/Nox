// pages/systemCleanup.js

export function init() {
  // grab buttons
  const btns = {
    scan: document.getElementById('sc-scan'),
    cleanAll: document.getElementById('sc-clean-all'),
    cleanOldUpdates: document.getElementById('sc-clean-old-updates'),
    cleanDownloads: document.getElementById('sc-clean-downloads'),
    cleanTemp: document.getElementById('sc-clean-temp'),
  };

  // grab output elements
  const outputEl = document.getElementById('sc-output');
  const progressCt = document.getElementById('sc-progress');
  const progressBarInner = document.getElementById('sc-progress-bar');
  const messagesCt = document.getElementById('sc-messages');

  // helper: clear previous run
  function clearOutput() {
    messagesCt.innerHTML = '';
    progressBarInner.style.width = '0%';
    progressCt.classList.add('hidden');
  }
  // helper: show a colored message
  function addMessage(type, text) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = text;
    messagesCt.appendChild(div);
    outputEl.classList.remove('hidden');
  }

  // wire up progress events
  if (window.cleanupBridge.onProgress) {
    window.cleanupBridge.onProgress(pct => {
      progressCt.classList.remove('hidden');
      progressBarInner.style.width = `${pct}%`;
    });
  }

  // factory for each action
  function makeHandler(action, friendlyName) {
    return async () => {
      clearOutput();
      addMessage('info', `Starting: ${friendlyName}…`);
      try {
        const raw = await window.cleanupBridge.run(action);
        addMessage('success', `${friendlyName} complete.`);
        if (raw && raw.trim()) {
          // show script output as an info block
          addMessage('info', raw.trim());
        }
      } catch (err) {
        addMessage('error', `Error during ${friendlyName}: ${err.message}`);
      }
    };
  }

  // attach click handlers
  Object.entries(btns).forEach(([action, btn]) => {
    if (!btn) return;
    // derive a human-friendly label
    const labels = {
      scan: 'Scan',
      cleanAll: 'Clean All Files',
      cleanOldUpdates: 'Clean Old Updates',
      cleanDownloads: 'Clean Download Folder',
      cleanTemp: 'Clean Temp Folder',
    };
    const handler = makeHandler(action, labels[action] || action);
    btn.removeEventListener('click', btn._listener);
    btn.addEventListener('click', handler);
    btn._listener = handler;
  });
}
