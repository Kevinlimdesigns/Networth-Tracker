import { S, ACATS, LCATS, CCYS, MONS, NOW } from './state.js';
import { ic } from './icons.js';
import { sortEnt } from './compute.js';

export let editId = null;
export let isLM = false;
export let mEntries = [];
export let mMs = [];
export let cfFn = null;

export function buildCcySel() {
  document.getElementById('fCcy').innerHTML = CCYS.map(c => `<option value="${c}">${c}</option>`).join('');
}

export function buildFiltSel() {
  const s = document.getElementById('filtSel');
  s.innerHTML = `<option value="all">All accounts</option><option value="assets">Assets only</option><option value="liabs">Liabilities only</option>`
    + ACATS.map(c => `<option value="cat:${c.id}">${c.lbl}</option>`).join('');
  s.value = S.filter || 'all';
}

/* ── Year rows ────────────────────────────────── */
export function renderYrRows() {
  const list = document.getElementById('yrList');
  const ccy = document.getElementById('fCcy').value || 'SGD';
  document.getElementById('amtCol').textContent = 'Amount (' + ccy + ')';
  document.getElementById('monCcy').textContent = '(' + ccy + ')';
  if (!mEntries.length) {
    list.innerHTML = `<div style="font-size:.6875rem;color:var(--t3);padding:8px;text-align:center;border:1px dashed var(--bd);border-radius:8px">No years yet — click "+ Add year"</div>`;
    return;
  }
  const filled = mEntries.filter(e => e.value !== null && e.value !== undefined);
  const maxY = filled.length ? Math.max(...filled.map(e => e.year)) : null;
  const sorted = [...mEntries].map((e, i) => ({ ...e, i })).sort((a, b) => (b.year - a.year) || ((b.month ?? 0) - (a.month ?? 0)));
  list.innerHTML = sorted.map(e => `<div class="yr-row">
      <input class="yr-amt" type="number" value="${e.value === null || e.value === undefined ? '' : e.value}" min="0" step="1" placeholder="Leave blank to skip" onchange="window.__updV(${e.i},this.value)">
      <select onchange="window.__updM(${e.i},this.value)">${MONS.map((m, k) => `<option value="${k}" ${(e.month ?? 0) === k ? 'selected' : ''}>${m}</option>`).join('')}</select>
      <input class="yr-yr" type="number" value="${e.year}" min="1980" max="2100" step="1" onchange="window.__updY(${e.i},this.value)">
      <div class="yr-latest ${e.year === maxY ? '' : 'blank'}">Now</div>
      <button class="yr-del" onclick="window.__delY(${e.i})"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg></button>
    </div>`).join('');
  const ys = mEntries.map(e => e.year);
  document.getElementById('yrDup').style.display = new Set(ys).size !== ys.length ? 'block' : 'none';
}

export function addYearRow() {
  const used = mEntries.map(e => e.year);
  let y = used.length ? Math.min(...used) - 1 : NOW;
  while (used.includes(y)) y--;
  mEntries.push({ year: y, month: 0, value: null });
  renderYrRows();
}

export function updY(i, v) { mEntries[i].year = parseInt(v) || NOW; renderYrRows(); }
export function updM(i, v) { mEntries[i].month = parseInt(v) || 0; renderYrRows(); }
export function updV(i, v) {
  const s = String(v).trim();
  mEntries[i].value = s === '' ? null : (parseFloat(s) || 0);
  renderYrRows();
}
export function delY(i) { mEntries.splice(i, 1); renderYrRows(); }

/* ── Account modal ────────────────────────────── */
export function buildCatGrid(liab) {
  document.getElementById('catGrid').innerHTML = (liab ? LCATS : ACATS).map((c, i) =>
    `<label class="cat-opt ${i === 0 ? 'sel' : ''}" onclick="window.__pickCat(this)"><input type="radio" name="cat" value="${c.id}" ${i === 0 ? 'checked' : ''}>${ic(c.id, 16, 2)}<span class="cat-lbl">${c.lbl}</span></label>`).join('');
}

export function setType(l) {
  isLM = l;
  document.getElementById('tBtnA').className = 'type-btn' + (l ? '' : ' active');
  document.getElementById('tBtnL').className = 'type-btn' + (l ? ' active' : '');
  document.getElementById('yrLabel').textContent = l ? 'Outstanding balance by year' : 'Value by year';
  document.getElementById('monField').style.display = l ? 'none' : 'block';
  buildCatGrid(l);
}

export function openAdd(l) {
  editId = null;
  mEntries.length = 0;
  mEntries.push({ year: NOW, month: 0, value: null });
  document.getElementById('modalH').textContent = 'Add Entry';
  document.getElementById('fName').value = '';
  document.getElementById('fCcy').value = 'SGD';
  document.getElementById('fMon').value = '';
  document.getElementById('fArc').checked = false;
  document.getElementById('delBtn').style.display = 'none';
  setType(!!l);
  renderYrRows();
  document.getElementById('ov').classList.add('open');
  setTimeout(() => document.getElementById('fName').focus(), 50);
}

export function openEdit(id) {
  editId = id;
  const a = S.accounts.find(x => x.id === id);
  if (!a) return;
  mEntries.length = 0;
  (a.entries || []).forEach(e => mEntries.push({ month: 0, ...e }));
  if (!mEntries.length) mEntries.push({ year: NOW, month: 0, value: null });
  document.getElementById('modalH').textContent = 'Edit ' + a.name;
  document.getElementById('fName').value = a.name;
  document.getElementById('fCcy').value = a.ccy || 'SGD';
  document.getElementById('fMon').value = a.monthly || '';
  document.getElementById('fArc').checked = !!a.archived;
  document.getElementById('delBtn').style.display = 'block';
  setType(!!a.isLiab);
  setTimeout(() => document.querySelectorAll('.cat-opt').forEach(e => {
    const m = e.querySelector('input').value === a.cat;
    e.classList.toggle('sel', m);
    if (m) e.querySelector('input').checked = true;
  }), 20);
  renderYrRows();
  document.getElementById('ov').classList.add('open');
}

export function closeModal() {
  document.getElementById('ov').classList.remove('open');
  editId = null;
  mEntries.length = 0;
}

export function pickCat(el) {
  document.querySelectorAll('.cat-opt').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
}

export async function saveAcc() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { document.getElementById('fName').focus(); return; }
  const ys = mEntries.map(e => e.year);
  if (new Set(ys).size !== ys.length) { document.getElementById('yrDup').style.display = 'block'; return; }
  const cat = document.querySelector('.cat-opt.sel input')?.value || (isLM ? 'mortgage' : 'investments');
  const entries = sortEnt(mEntries.filter(e => e.value !== null && e.value !== undefined)
    .map(e => ({ year: e.year, month: e.month ?? 0, value: e.value })));
  const ccy = document.getElementById('fCcy').value || 'SGD';
  const monthly = isLM ? 0 : (parseFloat(document.getElementById('fMon').value) || 0);
  const archived = document.getElementById('fArc').checked;
  if (editId) {
    const a = S.accounts.find(x => x.id === editId);
    if (a) Object.assign(a, { name, cat, isLiab: isLM, entries, ccy, monthly, archived });
  } else {
    S.accounts.push({ id: 'a' + Date.now(), name, cat, isLiab: isLM, entries, ccy, monthly, archived, order: S.accounts.length });
  }
  const { persist } = await import('./storage.js');
  const { render } = await import('./render.js');
  await persist();
  render();
  closeModal();
}

export function deleteAcc() {
  const a = S.accounts.find(x => x.id === editId);
  if (!a) return;
  const safeName = a.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  askCf('Delete account',
    `Delete <strong>${safeName}</strong> and all ${(a.entries || []).length} year entries? This can't be undone.`,
    async () => {
      S.accounts = S.accounts.filter(x => x.id !== editId);
      const { persist } = await import('./storage.js');
      const { render } = await import('./render.js');
      await persist();
      render();
      closeModal();
    });
}

/* ── Confirm modal ────────────────────────────── */
export function askCf(title, msg, fn) {
  document.getElementById('cfTitle').textContent = title;
  document.getElementById('cfMsg').innerHTML = msg;
  cfFn = fn;
  document.getElementById('cfOv').classList.add('open');
}

export function closeCf() {
  document.getElementById('cfOv').classList.remove('open');
  cfFn = null;
}

/* ── FX modal ─────────────────────────────────── */
export function openFx() {
  document.getElementById('fxList').innerHTML = CCYS.filter(c => c !== 'SGD').map(c =>
    `<div class="fx-row"><label>${c}</label><input type="number" step="0.0001" min="0" id="fx_${c}" value="${S.fx[c] ?? 1}"></div>`).join('');
  document.getElementById('fxOv').classList.add('open');
}

export function closeFx() {
  document.getElementById('fxOv').classList.remove('open');
}

export async function saveFx() {
  CCYS.filter(c => c !== 'SGD').forEach(c => {
    const v = parseFloat(document.getElementById('fx_' + c).value);
    if (v > 0) S.fx[c] = v;
  });
  S.fx.SGD = 1;
  const { persist } = await import('./storage.js');
  const { render } = await import('./render.js');
  await persist();
  render();
  closeFx();
}

/* ── Milestones modal ─────────────────────────── */
export function openMs() {
  mMs.length = 0;
  S.milestones.forEach(m => mMs.push({ ...m }));
  renderMsRows();
  document.getElementById('msOv').classList.add('open');
}

export function closeMs() {
  document.getElementById('msOv').classList.remove('open');
}

export function renderMsRows() {
  document.getElementById('msList').innerHTML = mMs.map((m, i) =>
    `<div class="ms-row"><input type="text" value="${m.name.replace(/"/g, '&quot;')}" placeholder="Name" onchange="window.__mMs[${i}].name=this.value">
     <input type="number" value="${m.amount}" min="0" step="1000" onchange="window.__mMs[${i}].amount=parseFloat(this.value)||0">
     <button class="yr-del" onclick="window.__mMs.splice(${i},1);window.__renderMsRows()"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg></button></div>`).join('');
}

export function addMsRow() {
  mMs.push({ name: 'New goal', amount: 0 });
  renderMsRows();
}

export async function saveMs() {
  S.milestones = mMs.filter(m => m.name.trim() && m.amount > 0).sort((a, b) => a.amount - b.amount);
  const { persist } = await import('./storage.js');
  const { renderMilestones } = await import('./render.js');
  await persist();
  renderMilestones();
  closeMs();
}
