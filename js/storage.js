import { S, DEFFX, NOW } from './state.js';

const KEY = 'sgw-v9';

export function readStore(k) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }
  catch (e) { console.warn('Read failed', e); return null; }
}

export function writeStore(k, obj) {
  try { localStorage.setItem(k, JSON.stringify(obj)); return true; }
  catch (e) {
    if (e.name === 'QuotaExceededError') {
      // lazy import to avoid circular dep at module load time
      import('./modals.js').then(({ askCf }) =>
        askCf('Storage full', 'Your browser storage limit is reached. Export your data, then remove some year entries.', null));
    } else {
      console.error('Write failed', e);
    }
    return false;
  }
}

export async function persist() {
  const ok = writeStore(KEY, S);
  document.getElementById('savedLbl').textContent = ok
    ? 'Saved ' + new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
    : 'Not saved — export your data';
}

export async function load() {
  const { applyTheme, render } = await import('./render.js');
  const { buildCcySel, buildFiltSel } = await import('./modals.js');

  const d = readStore(KEY) || readStore('sgw-v8') || readStore('sgw-v7');
  if (d) Object.assign(S, d);
  if (!S.fx) S.fx = { ...DEFFX };
  S.accounts = (S.accounts || []).map((a, i) => ({
    ccy: 'SGD', monthly: 0, archived: false, order: i,
    entries: a.entries || [{ year: NOW, value: a.val || 0 }], ...a
  }));
  applyTheme(S.theme || 'dark');
  buildCcySel();
  buildFiltSel();
  document.getElementById('sortSel').value = S.sort || 'value';
  document.getElementById('arcTog').classList.toggle('on', !!S.showArc);
  document.getElementById('projTog').classList.toggle('on', !!S.proj);
  const b = document.getElementById('cpfBadge');
  b.textContent = S.cpfOn ? 'ON' : 'OFF';
  b.className = 'cpf-badge ' + (S.cpfOn ? 'on' : 'off');
  const ab = document.getElementById('accBadge');
  ab.textContent = S.accrue ? 'ON' : 'OFF';
  ab.className = 'cpf-badge ' + (S.accrue ? 'on' : 'off');
  // Reflect saved chart range in tab highlight
  const tabs = document.querySelectorAll('.tt');
  const tfMap = { 0: 3, 3: 0, 5: 1, 10: 2 };
  tabs.forEach(t => t.classList.remove('active'));
  const activeIdx = tfMap[S.tfYears] ?? 3;
  if (tabs[activeIdx]) tabs[activeIdx].classList.add('active');
  document.getElementById('savedLbl').textContent =
    new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  render();
}

export function exportData() {
  const b = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = `wealth-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

export function importData() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json,.json';
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = async ev => {
      const { askCf } = await import('./modals.js');
      const { applyTheme, render } = await import('./render.js');
      const { buildFiltSel } = await import('./modals.js');
      try {
        const d = JSON.parse(ev.target.result);
        if (!d || !Array.isArray(d.accounts)) throw new Error('No accounts array found');
        askCf('Replace all data',
          `Import <strong>${d.accounts.length} account(s)</strong> from this file? Your current data will be replaced. Export first if you want a backup.`,
          async () => {
            Object.assign(S, d);
            if (!S.fx) S.fx = { ...DEFFX };
            S.accounts = S.accounts.map((a, i) => ({
              ccy: 'SGD', monthly: 0, archived: false, order: i,
              entries: a.entries || [{ year: NOW, value: a.val || 0 }], ...a
            }));
            await persist();
            buildFiltSel();
            document.getElementById('sortSel').value = S.sort || 'value';
            applyTheme(S.theme || 'dark');
            render();
          });
      } catch (err) {
        askCf('Import failed', `That file couldn't be read: ${err.message}`, null);
      }
    };
    rd.readAsText(f);
  };
  inp.click();
}
