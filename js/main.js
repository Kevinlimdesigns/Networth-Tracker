import { S, NOW } from './state.js';
import { load, persist, exportData, importData } from './storage.js';
import {
  render, renderLine, renderDonut, renderPlatforms,
  applyTheme, isDark, renderHero, renderMilestones
} from './render.js';
import * as modals from './modals.js';
import {
  openAdd, openEdit, closeModal, saveAcc, deleteAcc, pickCat, setType,
  addYearRow, updY, updM, updV, delY, renderYrRows,
  askCf, closeCf,
  openFx, closeFx, saveFx,
  openMs, closeMs, saveMs, addMsRow, renderMsRows, mMs,
  buildFiltSel
} from './modals.js';

/* Expose functions needed from inline HTML event handlers */
window.__openAdd = openAdd;
window.__openEdit = openEdit;
window.__closeModal = closeModal;
window.__saveAcc = saveAcc;
window.__deleteAcc = deleteAcc;
window.__pickCat = pickCat;
window.__setType = setType;
window.__addYearRow = addYearRow;
window.__updY = updY;
window.__updM = updM;
window.__updV = updV;
window.__delY = delY;
window.__renderYrRows = renderYrRows;
window.__closeCf = closeCf;
window.__openFx = openFx;
window.__closeFx = closeFx;
window.__saveFx = saveFx;
window.__openMs = openMs;
window.__closeMs = closeMs;
window.__saveMs = saveMs;
window.__addMsRow = addMsRow;
window.__renderMsRows = renderMsRows;
window.__mMs = mMs;
window.__loadSample = loadSample;

/* ── Toggle helpers ──────────────────────────── */
window.toggleTheme = function () {
  const n = isDark() ? 'light' : 'dark';
  S.theme = n;
  applyTheme(n);
  persist();
  renderLine();
  renderDonut();
};

window.toggleCpf = function () {
  S.cpfOn = !S.cpfOn;
  const b = document.getElementById('cpfBadge');
  b.textContent = S.cpfOn ? 'ON' : 'OFF';
  b.className = 'cpf-badge ' + (S.cpfOn ? 'on' : 'off');
  persist();
  renderHero();
  renderMilestones();
  renderLine();
};

window.toggleAccrue = function () {
  S.accrue = !S.accrue;
  const b = document.getElementById('accBadge');
  b.textContent = S.accrue ? 'ON' : 'OFF';
  b.className = 'cpf-badge ' + (S.accrue ? 'on' : 'off');
  persist();
  render();
};

window.toggleArchived = function () {
  S.showArc = !S.showArc;
  document.getElementById('arcTog').classList.toggle('on', S.showArc);
  persist();
  renderPlatforms();
};

window.toggleProj = function () {
  S.proj = !S.proj;
  document.getElementById('projTog').classList.toggle('on', S.proj);
  persist();
  renderLine();
};

window.setSort = function (v) { S.sort = v; persist(); renderPlatforms(); };
window.setFilter = function (v) { S.filter = v; persist(); renderPlatforms(); };

window.setTf = function (y, btn) {
  S.tfYears = y;
  document.querySelectorAll('.tt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  persist();
  renderLine();
};

window.moveAcc = function (id, dir) {
  const list = [...S.accounts].filter(a => !!S.accounts.find(x => x.id === id).isLiab === !!a.isLiab)
    .sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
  const i = list.findIndex(a => a.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  const oi = list[i].order ?? i, oj = list[j].order ?? j;
  list[i].order = oj; list[j].order = oi;
  persist();
  renderPlatforms();
};

window.exportData = exportData;
window.importData = importData;

/* Wire confirm button — cfFn is a module-level var; access via the namespace import */
document.getElementById('cfYes').onclick = () => {
  const f = modals.cfFn;
  closeCf();
  if (f) f();
};

/* ── Sample data ──────────────────────────────── */
function loadSample() {
  S.accounts = [
    { id: 's1', name: 'IBKR', cat: 'investments', isLiab: false, ccy: 'USD', monthly: 1000, archived: false, order: 0, entries: [{ year: NOW - 3, value: 20000 }, { year: NOW - 2, value: 38000 }, { year: NOW - 1, value: 61000 }, { year: NOW, value: 92000 }] },
    { id: 's2', name: 'DBS Multiplier', cat: 'cash', isLiab: false, ccy: 'SGD', monthly: 500, archived: false, order: 1, entries: [{ year: NOW - 3, value: 15000 }, { year: NOW - 1, value: 22000 }, { year: NOW, value: 28000 }] },
    { id: 's3', name: 'CPF OA', cat: 'cpf', isLiab: false, ccy: 'SGD', monthly: 1200, archived: false, order: 2, entries: [{ year: NOW - 3, value: 40000 }, { year: NOW - 2, value: 58000 }, { year: NOW - 1, value: 78000 }, { year: NOW, value: 101000 }] },
    { id: 's4', name: 'HDB Loan', cat: 'mortgage', isLiab: true, ccy: 'SGD', monthly: 0, archived: false, order: 3, entries: [{ year: NOW - 3, value: 320000 }, { year: NOW - 2, value: 305000 }, { year: NOW - 1, value: 289000 }, { year: NOW, value: 272000 }] }
  ];
  persist();
  render();
}

/* ── Overlay click-to-close ─────────────────────── */
['ov', 'cfOv', 'fxOv', 'msOv'].forEach(id => {
  const el = document.getElementById(id);
  let down = false;
  el.addEventListener('mousedown', e => { down = (e.target === el); });
  el.addEventListener('click', e => { if (e.target === el && down) el.classList.remove('open'); down = false; });
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  ['msOv', 'fxOv', 'cfOv', 'ov'].some(id => {
    const el = document.getElementById(id);
    if (el.classList.contains('open')) { el.classList.remove('open'); return true; }
    return false;
  });
});

window.addEventListener('resize', () => { renderLine(); renderDonut(); });
window.addEventListener('load', load);
