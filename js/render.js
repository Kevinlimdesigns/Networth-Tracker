import { S, CCOL, CBGS, NOW } from './state.js';
import { ic } from './icons.js';
import {
  totals, allYears, latestYear, prevYear, monthlyIn,
  totalAccrual, accrualFor, accruedVal, curVal, growthPct, sortAccs
} from './compute.js';

export let lineInst = null;
export let donutInst = null;

export function setLineInst(v) { lineInst = v; }
export function setDonutInst(v) { donutInst = v; }

const fmt = n => new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n);
const fS = n => {
  const a = Math.abs(n);
  if (a >= 1e6) return (n < 0 ? '-' : '') + 'S$' + (a / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (n < 0 ? '-' : '') + 'S$' + (a / 1e3).toFixed(1) + 'K';
  return fmt(n);
};
export const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

export function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeBtn').innerHTML = t === 'dark'
    ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2 12h2M20 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5"/></svg>'
    : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
}

export function render() {
  renderHero();
  renderMetrics();
  renderMilestones();
  renderLine();
  renderDonut();
  renderPlatforms();
}

export function renderHero() {
  const ly = latestYear(), py = prevYear(), t = totals(S.cpfOn, ly), cAll = totals(true, ly);
  const acc = S.accrue ? totalAccrual() : 0;
  const net = t.net + acc;
  document.getElementById('hMode').textContent =
    (S.cpfOn ? 'NET WORTH' : 'LIQUID NET WORTH') + (acc > 0 ? ' · ESTIMATED TODAY' : ' · ' + ly);
  document.getElementById('hVal').textContent = fmt(net);
  document.getElementById('hAssets').textContent = fS(t.assets + acc);
  document.getElementById('hLiab').textContent = '−' + fS(t.liab);
  const note = document.getElementById('cpfNote');
  const bits = [];
  if (acc > 0) bits.push(`${fS(t.net)} confirmed + ${fS(acc)} est.`);
  if (!S.cpfOn && cAll.cpf > 0) bits.push('CPF ' + fS(cAll.cpf) + ' excluded');
  if (bits.length) { note.textContent = bits.join(' · '); note.style.display = 'block'; }
  else note.style.display = 'none';
  const el = document.getElementById('hChg');
  if (py !== null) {
    const p = totals(S.cpfOn, py), d = net - p.net, pc = p.net ? ((d / Math.abs(p.net)) * 100) : 0, s = d >= 0 ? '+' : '';
    el.textContent = `${s}${fmt(d)} (${s}${pc.toFixed(1)}%) vs ${py}`;
    el.className = 'h-chg ' + (d >= 0 ? 'pos' : 'neg');
  } else {
    el.textContent = 'Add an earlier year to see growth';
    el.className = 'h-chg';
  }
}

function setChg(id, cur, prv, py) {
  const el = document.getElementById(id);
  if (prv === null) { el.textContent = '—'; el.className = 'm-c'; return; }
  const d = cur - prv, p = prv ? ((d / Math.abs(prv)) * 100) : 0, s = d >= 0 ? '+' : '';
  el.textContent = `${s}${fS(d)} (${s}${p.toFixed(1)}%) vs ${py}`;
  el.className = 'm-c ' + (d >= 0 ? 'pos' : 'neg');
}

export function renderMetrics() {
  const ly = latestYear(), py = prevYear(), t = totals(true, ly), p = py !== null ? totals(true, py) : null;
  document.getElementById('mInv').textContent = fmt(t.inv + t.cry);
  document.getElementById('mCash').textContent = fmt(t.cash);
  document.getElementById('mCpf').textContent = fmt(t.cpf + t.prop);
  setChg('mInvC', t.inv + t.cry, p ? p.inv + p.cry : null, py);
  setChg('mCashC', t.cash, p ? p.cash : null, py);
  setChg('mCpfC', t.cpf + t.prop, p ? p.cpf + p.prop : null, py);
  const mo = monthlyIn(), acc = S.accrue ? totalAccrual() : 0;
  document.getElementById('mMon').textContent = fmt(mo);
  document.getElementById('mMonC').textContent = mo > 0
    ? (acc > 0 ? `${fS(acc)} accrued so far` : `${fS(mo * 12)} / year`)
    : 'No recurring set';
}

export function renderMilestones() {
  const t = totals(S.cpfOn), net = t.net;
  if (!S.milestones.length) {
    document.getElementById('msNodes').innerHTML = '';
    document.getElementById('msNext').textContent = 'Set milestones';
    return;
  }
  const ms = [...S.milestones].sort((a, b) => a.amount - b.amount);
  const max = ms[ms.length - 1].amount;
  const yrs = allYears();
  const peak = yrs.length ? Math.max(...yrs.map(y => totals(S.cpfOn, y).net)) : net;
  document.getElementById('msFill').style.width = Math.min(Math.max((net / max) * 100, 0), 100) + '%';
  const nxt = ms.find(m => peak < m.amount);
  document.getElementById('msNext').textContent = nxt ? `${fS(nxt.amount - net)} to ${nxt.name}` : 'All reached — edit';
  document.getElementById('msNodes').innerHTML = ms.map(m => {
    const done = peak >= m.amount, isN = nxt && nxt.amount === m.amount;
    return `<div class="ms-node ${done ? 'done' : isN ? 'next' : ''}"><div class="ms-pip ${done ? 'done' : isN ? 'next' : ''}">${done ? '✓' : ''}</div><div class="ms-nm">${m.name}</div><div class="ms-am">${fS(m.amount)}</div></div>`;
  }).join('');
}

export function renderLine() {
  const canvas = document.getElementById('lineChart'), ctx = canvas.getContext('2d');
  if (lineInst) { lineInst.destroy(); lineInst = null; }
  const dark = isDark(), gridC = dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)',
    tickC = dark ? '#475569' : '#94a3b8', surfC = dark ? '#161b27' : '#fff';
  const yrs = allYears(), sub = document.getElementById('tcSub');
  if (!yrs.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = tickC; ctx.font = '12px DM Sans'; ctx.textAlign = 'center';
    ctx.fillText('No year entries yet', (canvas.offsetWidth || 300) / 2, (canvas.offsetHeight || 100) / 2);
    sub.textContent = 'Add year entries to build your history'; return;
  }
  const lo = yrs[0], hi = yrs[yrs.length - 1];
  let full = []; for (let y = lo; y <= hi; y++) full.push(y);
  if (S.tfYears > 0) full = full.filter(y => y > hi - S.tfYears);
  const actual = full.map(y => totals(S.cpfOn, y).net);
  const labels = full.map(String);
  const ds = [{
    label: 'Actual', data: [...actual], borderColor: '#2563eb',
    backgroundColor: dark ? 'rgba(37,99,235,.12)' : 'rgba(37,99,235,.06)',
    borderWidth: 2.5, fill: true, tension: .3, pointRadius: 4,
    pointBackgroundColor: '#2563eb', pointBorderColor: surfC, pointBorderWidth: 2, pointHoverRadius: 6
  }];
  const mo = monthlyIn();
  if (S.proj && mo > 0 && actual.length) {
    const last = actual[actual.length - 1];
    const pj = new Array(actual.length - 1).fill(null); pj.push(last);
    for (let i = 1; i <= 3; i++) {
      labels.push(String(hi + i)); ds[0].data.push(null); pj.push(last + mo * 12 * i);
    }
    ds.push({
      label: 'Projected', data: pj, borderColor: '#7c3aed', borderDash: [5, 4],
      borderWidth: 2, fill: false, tension: .2, pointRadius: 3,
      pointBackgroundColor: '#7c3aed', pointBorderColor: surfC, pointBorderWidth: 2, pointHoverRadius: 5
    });
  }
  sub.textContent = (full.length > 1 ? `${full[0]}–${full[full.length - 1]}` : `${full[0]}`) +
    ` · ${S.cpfOn ? 'incl. CPF' : 'excl. CPF'}` + (S.proj && mo > 0 ? ` · projected at ${fS(mo)}/mo` : '');
  lineInst = new Chart(ctx, {
    type: 'line', data: { labels, datasets: ds },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: dark ? '#1e2438' : '#0f172a',
          titleFont: { family: 'DM Sans', size: 10 },
          bodyFont: { family: 'DM Sans', size: 12, weight: '600' },
          padding: 8, cornerRadius: 6,
          filter: i => i.parsed.y !== null,
          callbacks: {
            label: c => {
              const i = c.dataIndex, arr = c.dataset.data, prev = i > 0 ? arr[i - 1] : null;
              let s = ' ' + (c.dataset.label === 'Projected' ? '~' : '') + fmt(c.parsed.y);
              if (prev !== null && prev !== undefined) {
                const d = c.parsed.y - prev, p = prev ? ((d / Math.abs(prev)) * 100) : 0;
                s += `  (${d >= 0 ? '+' : ''}${fS(d)} / ${d >= 0 ? '+' : ''}${p.toFixed(1)}%)`;
              }
              return s;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 10 }, color: tickC }, border: { display: false } },
        y: { grid: { color: gridC }, ticks: { font: { family: 'DM Sans', size: 10 }, color: tickC, callback: v => fS(v) }, border: { display: false } }
      }
    }
  });
}

export function renderDonut() {
  const t = totals(true), canvas = document.getElementById('donutChart'), ctx = canvas.getContext('2d');
  if (donutInst) { donutInst.destroy(); donutInst = null; }
  const dark = isDark(), surfC = dark ? '#161b27' : '#fff';
  document.getElementById('dTotal').textContent = fS(t.nonCpf);
  const segs = [
    { l: 'Invest', v: t.inv, c: CCOL.investments }, { l: 'Crypto', v: t.cry, c: CCOL.crypto },
    { l: 'Cash', v: t.cash, c: CCOL.cash }, { l: 'Prop', v: t.prop, c: CCOL.property }
  ].filter(s => s.v > 0);
  if (!segs.length) {
    document.getElementById('allocList').innerHTML = '<div style="font-size:.625rem;color:var(--t3)">No non-CPF assets</div>';
    return;
  }
  donutInst = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: segs.map(s => s.l), datasets: [{ data: segs.map(s => s.v), backgroundColor: segs.map(s => s.c), borderWidth: 2, borderColor: surfC }] },
    options: {
      responsive: false, cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: dark ? '#1e2438' : '#0f172a',
          bodyFont: { family: 'DM Sans', size: 11, weight: '600' }, padding: 7, cornerRadius: 5,
          callbacks: { label: c => ' ' + fmt(c.parsed) + ' (' + (t.nonCpf ? ((c.parsed / t.nonCpf) * 100).toFixed(1) : 0) + '%)' }
        }
      }
    }
  });
  document.getElementById('allocList').innerHTML = segs.map(s => {
    const p = t.nonCpf ? ((s.v / t.nonCpf) * 100).toFixed(1) : '0';
    return `<div class="al-item"><div class="al-sw" style="background:${s.c}"></div><div class="al-b"><div class="al-row"><span class="al-n">${s.l}</span><span class="al-v">${fS(s.v)}</span></div><div class="al-bar"><div class="al-fill" style="width:${p}%;background:${s.c}"></div></div></div><span class="al-pct">${p}%</span></div>`;
  }).join('');
}

function accRow(a) {
  const e = [...(a.entries || [])].sort((x, y) => x.year - y.year);
  const base = curVal(a), acc = S.accrue ? accrualFor(a) : 0, n = base + acc, g = growthPct(a);
  let dlt = '';
  if (g !== null) {
    const up = a.isLiab ? g < 0 : g > 0;
    dlt = `<div class="prow-dlt ${up ? 'pos' : 'neg'}">${g >= 0 ? '▲' : '▼'} ${Math.abs(g).toFixed(0)}%</div>`;
  }
  const yr = e.length
    ? (e[0].year === e[e.length - 1].year ? `${e[0].year}` : `${e[0].year}–${e[e.length - 1].year}`)
    : 'no data';
  const moTxt = (!a.isLiab && a.monthly > 0)
    ? ` · <span class="mo-tag">${fS(a.monthly * (S.fx?.[a.ccy || 'SGD'] ?? 1))}/mo</span>` : '';
  const ccyTag = (a.ccy && a.ccy !== 'SGD') ? `<span class="ccy-tag">${a.ccy}</span>` : '';
  const ordBtns = S.sort === 'custom'
    ? `<div class="ord"><button onclick="event.stopPropagation();moveAcc('${a.id}',-1)">▲</button><button onclick="event.stopPropagation();moveAcc('${a.id}',1)">▼</button></div>`
    : '';
  // esc() applied to user-controlled name to prevent XSS
  const safeName = a.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<div class="prow ${a.isLiab ? 'liab' : ''} ${a.archived ? 'arc' : ''}" onclick="window.__openEdit('${a.id}')" title="${safeName}">
    <div class="prow-ico" style="background:${CBGS[a.cat] || 'var(--sf2)'};color:${CCOL[a.cat] || 'var(--t2)'}">${ic(a.cat, 14)}</div>
    <div class="prow-info"><div class="prow-name"><span class="nm">${safeName}</span>${ccyTag}</div><div class="prow-sub">${yr}${moTxt}</div></div>
    <div class="prow-r"><div class="prow-val ${a.isLiab ? 'neg' : ''} ${acc > 0 ? 'accr' : ''}">${a.isLiab ? '−' : ''}${fS(n)}</div>${dlt}</div>${ordBtns}
  </div>`;
}

export function renderPlatforms() {
  document.getElementById('latestYrChip').textContent = allYears().length ? latestYear() : '—';
  const el = document.getElementById('platList');
  if (!S.accounts.length) {
    el.innerHTML = `<div class="est">
      <div class="est-ico"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg></div>
      <h3>No accounts yet</h3>
      <p>Add a brokerage, bank or CPF account, then backfill past years to build your growth chart.</p>
      <button class="btn btn-p" onclick="window.__openAdd(false)">Add your first account</button>
      <button class="btn" onclick="window.__loadSample()">Load sample data</button>
    </div>`;
    return;
  }
  const vis = S.accounts.filter(a => (S.showArc || !a.archived) && passFilter(a));
  if (!vis.length) {
    el.innerHTML = `<div class="est"><h3>Nothing matches</h3><p>No accounts fit this filter. Try "All accounts" or show archived.</p></div>`;
    return;
  }
  const A = sortAccs(vis.filter(a => !a.isLiab)), L = sortAccs(vis.filter(a => a.isLiab));
  const arcN = S.accounts.filter(a => a.archived).length;
  let h = '';
  if (A.length) h += `<div class="sect-tag"><span>Assets</span><span>${A.length}</span></div>` + A.map(accRow).join('');
  if (L.length) h += `<div class="sect-tag" style="margin-top:6px"><span>Liabilities</span><span>${L.length}</span></div>` + L.map(accRow).join('');
  if (arcN && !S.showArc) h += `<div style="padding:8px 6px;font-size:.5625rem;color:var(--t3);text-align:center">${arcN} archived hidden</div>`;
  el.innerHTML = h;
}

function passFilter(a) {
  const f = S.filter || 'all';
  if (f === 'all') return true;
  if (f === 'assets') return !a.isLiab;
  if (f === 'liabs') return !!a.isLiab;
  if (f.startsWith('cat:')) return a.cat === f.slice(4);
  return true;
}
