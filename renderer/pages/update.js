// renderer/pages/systemHealth.js
export function init() {
    const log = document.getElementById('health-log');
    const updateBtn = document.getElementById('updateBtn');
    const loader = document.getElementById('update-loading');

    if (!log || !updateBtn || !loader || !window.noxAPI) return;

    updateBtn.onclick = async () => {
        // Reset log and show loader
        log.textContent = '> Running: winget update\n\n';
        loader.classList.remove('hidden');
        updateBtn.disabled = true;

        try {
            const output = await window.noxAPI.runUpdate();
            log.textContent += output;
        } catch (error) {
            log.textContent += `\n❌ Error: ${error}`;
        } finally {
            loader.classList.add('hidden');
            updateBtn.disabled = false;
        }
    };
}
