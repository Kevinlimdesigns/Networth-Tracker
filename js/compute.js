/* Pure computation functions — no DOM, no S mutations */
import { S, NOW } from './state.js';

export function sortEnt(e) {
  return [...e].sort((a, b) => a.year - b.year);
}

export function valAtRaw(a, y) {
  const e = sortEnt(a.entries || []);
  let v = null;
  for (const x of e) {
    if (x.year <= y) v = x.value;
    else break;
  }
  return v === null ? 0 : v;
}

export function rate(c) {
  return S.fx?.[c] ?? 1;
}

export function valAt(a, y) {
  return valAtRaw(a, y) * rate(a.ccy || 'SGD');
}

export function curVal(a) {
  const e = sortEnt(a.entries || []);
  return (e.length ? e[e.length - 1].value : 0) * rate(a.ccy || 'SGD');
}

export function allYears() {
  const s = new Set();
  S.accounts.forEach(a => (a.entries || []).forEach(e => s.add(e.year)));
  return [...s].sort((a, b) => a - b);
}

export function latestYear() {
  const y = allYears();
  return y.length ? y[y.length - 1] : NOW;
}

export function prevYear() {
  const y = allYears();
  return y.length >= 2 ? y[y.length - 2] : null;
}

export function totals(inclCpf = true, year = null) {
  const y = year === null ? latestYear() : year;
  let inv = 0, cry = 0, cash = 0, cpf = 0, prop = 0, liab = 0;
  S.accounts.forEach(a => {
    const v = valAt(a, y);
    if (a.isLiab) { liab += v; return; }
    if (a.cat === 'investments') inv += v;
    else if (a.cat === 'crypto') cry += v;
    else if (a.cat === 'cash') cash += v;
    else if (a.cat === 'cpf') cpf += v;
    else if (a.cat === 'property') prop += v;
  });
  const c = inclCpf ? cpf : 0;
  const assets = inv + cry + cash + c + prop;
  return { inv, cry, cash, cpf, prop, liab, assets, nonCpf: inv + cry + cash + prop, net: assets - liab, year: y };
}

export function monthlyIn() {
  return S.accounts
    .filter(a => !a.isLiab)
    .reduce((s, a) => s + ((a.monthly || 0) * rate(a.ccy || 'SGD')), 0);
}

export function monthsSince(a) {
  const e = sortEnt(a.entries || []);
  if (!e.length) return 0;
  const last = e[e.length - 1];
  const now = new Date();
  const m = (now.getFullYear() - last.year) * 12 + (now.getMonth() - (last.month ?? 0));
  return Math.max(0, m);
}

export function accrualFor(a) {
  if (a.isLiab || !a.monthly) return 0;
  return monthsSince(a) * a.monthly * rate(a.ccy || 'SGD');
}

export function totalAccrual() {
  return S.accounts.reduce((s, a) => s + accrualFor(a), 0);
}

export function accruedVal(a) {
  return curVal(a) + (S.accrue ? accrualFor(a) : 0);
}

export function growthPct(a) {
  const e = sortEnt(a.entries || []);
  if (e.length < 2) return null;
  const n = e[e.length - 1].value, p = e[e.length - 2].value;
  if (!p) return null;
  return ((n - p) / Math.abs(p)) * 100;
}

export function sortAccs(list) {
  const m = {
    value: (x, y) => accruedVal(y) - accruedVal(x),
    name: (x, y) => x.name.localeCompare(y.name),
    growth: (x, y) => (growthPct(y) ?? -1e9) - (growthPct(x) ?? -1e9),
    custom: (x, y) => (x.order ?? 0) - (y.order ?? 0)
  };
  return [...list].sort(m[S.sort] || m.value);
}
