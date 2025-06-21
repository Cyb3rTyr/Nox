// pages/systemCleanup.js

export function init() {
  // 1) grab all controls
  const btns = {
    scan: document.getElementById('sc-scan'),
    cleanAll: document.getElementById('sc-clean-all'),
    cleanOldUpdates: document.getElementById('sc-clean-old-updates'),
    cleanDownloads: document.getElementById('sc-clean-downloads'),
    cleanTemp: document.getElementById('sc-clean-temp'),
  };
  const outputEl = document.getElementById('sc-output');
  const progressCt = document.getElementById('sc-progress');
  const progressBar = document.getElementById('sc-progress-bar');
  const statusCt = document.getElementById('sc-status');
  const detailCt = document.getElementById('sc-detail');
  const detailTbl = document.getElementById('sc-detail-table');
  const summaryCt = document.getElementById('sc-summary');

  // 2) helpers
  function clearOutput() {
    statusCt.innerHTML = '';
    progressBar.style.width = '0';
    detailTbl.querySelector('thead').innerHTML = '';
    detailTbl.querySelector('tbody').innerHTML = '';
    summaryCt.textContent = '';
    [progressCt, detailCt, summaryCt].forEach(el => el.classList.add('hidden'));
    outputEl.classList.remove('hidden');
  }
  function addStatus(type, text) {
    const div = document.createElement('div');
    div.className = type;
    div.textContent = text;
    statusCt.appendChild(div);
    outputEl.classList.remove('hidden');
  }

  // 3) progress hook
  if (window.cleanupBridge.onProgress) {
    window.cleanupBridge.onProgress(pct => {
      progressCt.classList.remove('hidden');
      progressBar.style.width = `${pct}%`;
    });
  }

  // 4) parse & render the raw script output
  function renderDetail(raw) {
    const lines = raw.trim().split(/\r?\n/);
    // find the table header
    const hdrIdx = lines.findIndex(l => /^Folder\s+/.test(l));
    if (hdrIdx < 0) return;

    // split header columns by 2+ spaces
    const headers = lines[hdrIdx].trim().split(/\s{2,}/);

    // find data rows (skip underline & stop at blank or “Total”)
    const dataRows = [];
    for (let i = hdrIdx + 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || /^Total:/.test(line)) break;
      dataRows.push(line.split(/\s{2,}/));
    }

    // build <thead>
    const thead = detailTbl.querySelector('thead');
    const headRow = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    // build <tbody>
    const tbody = detailTbl.querySelector('tbody');
    dataRows.forEach(cols => {
      const tr = document.createElement('tr');
      cols.forEach(c => {
        const td = document.createElement('td');
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    detailCt.classList.remove('hidden');

    // extract “Total: X files, Y folders”
    const totalLine = lines.find(l => /^Total:/.test(l));
    if (totalLine) {
      summaryCt.textContent = totalLine.replace(/^Total:\s*/, '');
      summaryCt.classList.remove('hidden');
    }
  }

  // 5) click-handler factory
  function makeHandler(action, label) {
    return async () => {
      clearOutput();
      addStatus('info', `Starting ${label}…`);
      try {
        const raw = await window.cleanupBridge.run(action);
        addStatus('success', `${label} complete.`);
        if (raw && raw.trim()) {
          renderDetail(raw);
        }
      } catch (err) {
        addStatus('error', `Error during ${label}: ${err.message}`);
      }
    };
  }

  // 6) wire buttons
  const labels = {
    scan: 'Scan',
    cleanAll: 'Clean All Files',
    cleanOldUpdates: 'Clean Old Updates',
    cleanDownloads: 'Clean Download Folder',
    cleanTemp: 'Clean Temp Folder',
  };
  Object.entries(btns).forEach(([action, btn]) => {
    if (!btn) return;
    if (btn._listener) btn.removeEventListener('click', btn._listener);
    const handler = makeHandler(action, labels[action]);
    btn.addEventListener('click', handler);
    btn._listener = handler;
  });
}
