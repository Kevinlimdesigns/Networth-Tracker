/* node --test  (no dependencies) */
import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

/* Import the live S object so mutations are visible in compute.js */
import { S, DEFFX, NOW } from '../js/state.js';
import {
  sortEnt, valAtRaw, valAt, curVal, allYears, latestYear, prevYear,
  totals, monthlyIn, monthsSince, accrualFor, totalAccrual, accruedVal, growthPct
} from '../js/compute.js';

/* ── helpers ─────────────────────────────────────── */
function reset() {
  S.accounts = [];
  S.fx = { ...DEFFX };
  S.accrue = true;
  S.cpfOn = true;
  S.sort = 'value';
}

function acc(overrides) {
  return {
    id: 'test', name: 'Test', cat: 'cash', isLiab: false,
    ccy: 'SGD', monthly: 0, archived: false, order: 0, entries: [], ...overrides
  };
}

/* ── 1. sortEnt ──────────────────────────────────── */
describe('sortEnt', () => {
  it('sorts entries ascending by year', () => {
    const e = [{ year: 2023, value: 10 }, { year: 2021, value: 5 }, { year: 2022, value: 8 }];
    const sorted = sortEnt(e);
    assert.deepEqual(sorted.map(x => x.year), [2021, 2022, 2023]);
  });

  it('does not mutate the original array', () => {
    const e = [{ year: 2023, value: 10 }, { year: 2021, value: 5 }];
    sortEnt(e);
    assert.equal(e[0].year, 2023);
  });
});

/* ── 2. LOCF (Last Observation Carried Forward) ─── */
describe('valAtRaw — LOCF', () => {
  it('returns 0 when no entries', () => {
    assert.equal(valAtRaw(acc(), 2024), 0);
  });

  it('carries forward last value for years beyond the last entry', () => {
    const a = acc({ entries: [{ year: 2022, value: 50000 }] });
    assert.equal(valAtRaw(a, 2023), 50000);
    assert.equal(valAtRaw(a, 2025), 50000);
  });

  it('returns 0 for years before the first entry', () => {
    const a = acc({ entries: [{ year: 2022, value: 50000 }] });
    assert.equal(valAtRaw(a, 2021), 0);
  });

  it('returns exact value for the entry year', () => {
    const a = acc({ entries: [{ year: 2022, value: 50000 }, { year: 2024, value: 80000 }] });
    assert.equal(valAtRaw(a, 2022), 50000);
    assert.equal(valAtRaw(a, 2024), 80000);
  });

  it('carries forward correctly across a gap year', () => {
    const a = acc({ entries: [{ year: 2021, value: 30000 }, { year: 2023, value: 60000 }] });
    assert.equal(valAtRaw(a, 2022), 30000);  // gap year → LOCF from 2021
    assert.equal(valAtRaw(a, 2023), 60000);
  });
});

/* ── 3. Blank vs zero ────────────────────────────── */
describe('blank-vs-zero', () => {
  it('a value of 0 is a real value (closed account)', () => {
    const a = acc({ entries: [{ year: 2022, value: 50000 }, { year: 2023, value: 0 }] });
    assert.equal(valAtRaw(a, 2023), 0);
    assert.equal(valAtRaw(a, 2024), 0);  // LOCF carries the 0
  });

  it('null/undefined entries are excluded from sortEnt input (not stored)', () => {
    // simulate saveAcc filtering: entries with null value are dropped before storage
    const rawEntries = [{ year: 2022, value: null }, { year: 2023, value: 50000 }];
    const stored = rawEntries.filter(e => e.value !== null && e.value !== undefined);
    const a = acc({ entries: stored });
    assert.equal(valAtRaw(a, 2022), 0);   // no entry for 2022 → default 0
    assert.equal(valAtRaw(a, 2023), 50000);
  });
});

/* ── 4. Currency conversion ──────────────────────── */
describe('valAt — FX conversion', () => {
  beforeEach(reset);

  it('SGD account has rate 1', () => {
    const a = acc({ ccy: 'SGD', entries: [{ year: 2024, value: 10000 }] });
    assert.equal(valAt(a, 2024), 10000);
  });

  it('USD account multiplied by S.fx.USD', () => {
    S.fx.USD = 1.35;
    const a = acc({ ccy: 'USD', entries: [{ year: 2024, value: 1000 }] });
    assert.equal(valAt(a, 2024), 1350);
  });

  it('unknown currency defaults to rate 1', () => {
    const a = acc({ ccy: 'XYZ', entries: [{ year: 2024, value: 5000 }] });
    assert.equal(valAt(a, 2024), 5000);
  });
});

/* ── 5. totals() ─────────────────────────────────── */
describe('totals', () => {
  beforeEach(reset);

  it('sums assets and liabilities correctly', () => {
    S.accounts = [
      acc({ id: 'a1', cat: 'cash', entries: [{ year: 2024, value: 50000 }] }),
      acc({ id: 'a2', cat: 'investments', entries: [{ year: 2024, value: 100000 }] }),
      acc({ id: 'a3', isLiab: true, cat: 'mortgage', entries: [{ year: 2024, value: 200000 }] })
    ];
    const t = totals(true, 2024);
    assert.equal(t.cash, 50000);
    assert.equal(t.inv, 100000);
    assert.equal(t.liab, 200000);
    assert.equal(t.assets, 150000);
    assert.equal(t.net, -50000);
  });

  it('CPF toggle excludes CPF from assets and net', () => {
    S.accounts = [
      acc({ id: 'a1', cat: 'cash', entries: [{ year: 2024, value: 50000 }] }),
      acc({ id: 'a2', cat: 'cpf', entries: [{ year: 2024, value: 80000 }] })
    ];
    const withCpf = totals(true, 2024);
    const withoutCpf = totals(false, 2024);
    assert.equal(withCpf.net, 130000);
    assert.equal(withoutCpf.net, 50000);
    assert.equal(withoutCpf.cpf, 80000);  // cpf value still reported in breakdown
  });

  it('uses LOCF for gap years', () => {
    S.accounts = [
      acc({ id: 'a1', cat: 'cash', entries: [{ year: 2021, value: 10000 }, { year: 2023, value: 20000 }] })
    ];
    assert.equal(totals(true, 2022).cash, 10000);  // gap year LOCF
    assert.equal(totals(true, 2023).cash, 20000);
  });
});

/* ── 6. Accrual maths ────────────────────────────── */
describe('accrualFor / totalAccrual', () => {
  beforeEach(reset);

  it('returns 0 for liabilities', () => {
    const a = acc({ isLiab: true, monthly: 500, entries: [{ year: NOW - 1, month: 0, value: 10000 }] });
    assert.equal(accrualFor(a), 0);
  });

  it('returns 0 when monthly is 0', () => {
    const a = acc({ monthly: 0, entries: [{ year: NOW - 1, month: 0, value: 10000 }] });
    assert.equal(accrualFor(a), 0);
  });

  it('returns 0 for an account with no entries', () => {
    const a = acc({ monthly: 500, entries: [] });
    assert.equal(accrualFor(a), 0);
  });

  it('accrues months × monthly × fx (SGD)', () => {
    // Entry was Jan of the current year; now is Oct (index 9)
    // We control "now" indirectly through the entry date
    const currentMonth = new Date().getMonth();  // 0–11
    const currentYear = new Date().getFullYear();
    // Entry made 3 months ago (same year, 3 months earlier)
    const entryMonth = Math.max(0, currentMonth - 3);
    const monthsElapsed = currentMonth - entryMonth;  // should be 3 (or less if near start of year)
    const a = acc({ monthly: 1000, ccy: 'SGD', entries: [{ year: currentYear, month: entryMonth, value: 50000 }] });
    assert.equal(accrualFor(a), monthsElapsed * 1000);
  });

  it('accrues with FX conversion for foreign currency', () => {
    S.fx.USD = 1.35;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const entryMonth = Math.max(0, currentMonth - 2);
    const monthsElapsed = currentMonth - entryMonth;
    const a = acc({ monthly: 1000, ccy: 'USD', entries: [{ year: currentYear, month: entryMonth, value: 5000 }] });
    assert.equal(accrualFor(a), monthsElapsed * 1000 * 1.35);
  });

  it('totalAccrual sums across all non-liability accounts', () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const entryMonth = Math.max(0, currentMonth - 1);
    const m = currentMonth - entryMonth;
    S.accounts = [
      acc({ id: 'a1', monthly: 500, ccy: 'SGD', entries: [{ year: currentYear, month: entryMonth, value: 1000 }] }),
      acc({ id: 'a2', monthly: 300, ccy: 'SGD', entries: [{ year: currentYear, month: entryMonth, value: 2000 }] }),
      acc({ id: 'a3', isLiab: true, monthly: 200, ccy: 'SGD', entries: [{ year: currentYear, month: entryMonth, value: 5000 }] })
    ];
    assert.equal(totalAccrual(), (500 + 300) * m);
  });

  it('accrual is clamped to 0 (no negative accrual)', () => {
    const nextYear = new Date().getFullYear() + 1;
    const a = acc({ monthly: 500, entries: [{ year: nextYear, month: 0, value: 10000 }] });
    assert.equal(accrualFor(a), 0);
  });
});

/* ── 7. CPF toggle in accrual ────────────────────── */
describe('CPF toggle — accrual', () => {
  beforeEach(reset);

  it('CPF account accrual is included in totalAccrual when cpfOn=true', () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const entryMonth = Math.max(0, currentMonth - 1);
    const m = currentMonth - entryMonth;
    S.cpfOn = true;
    S.accounts = [
      acc({ id: 'cpf1', cat: 'cpf', monthly: 1200, ccy: 'SGD', entries: [{ year: currentYear, month: entryMonth, value: 50000 }] })
    ];
    assert.equal(totalAccrual(), 1200 * m);
  });

  it('NOTE: totalAccrual does NOT respect cpfOn — this is the known High bug (section 9)', () => {
    /* This test documents the current (broken) behaviour so we can confirm when it's fixed.
       totalAccrual() includes CPF even when S.cpfOn = false. */
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const entryMonth = Math.max(0, currentMonth - 1);
    const m = currentMonth - entryMonth;
    S.cpfOn = false;
    S.accounts = [
      acc({ id: 'cpf1', cat: 'cpf', monthly: 1200, ccy: 'SGD', entries: [{ year: currentYear, month: entryMonth, value: 50000 }] })
    ];
    // Documents current broken behaviour: CPF is still accrued even with cpfOn=false
    assert.equal(totalAccrual(), 1200 * m, 'Known bug: CPF still accrued when cpfOn=false');
  });
});

/* ── 8. growthPct ────────────────────────────────── */
describe('growthPct', () => {
  it('returns null for fewer than 2 entries', () => {
    const a = acc({ entries: [{ year: 2024, value: 10000 }] });
    assert.equal(growthPct(a), null);
  });

  it('returns null when previous value is 0', () => {
    const a = acc({ entries: [{ year: 2023, value: 0 }, { year: 2024, value: 10000 }] });
    assert.equal(growthPct(a), null);
  });

  it('calculates percentage correctly for growth', () => {
    const a = acc({ entries: [{ year: 2023, value: 50000 }, { year: 2024, value: 60000 }] });
    assert.equal(growthPct(a), 20);
  });

  it('calculates percentage correctly for decline', () => {
    const a = acc({ entries: [{ year: 2023, value: 100000 }, { year: 2024, value: 75000 }] });
    assert.equal(growthPct(a), -25);
  });
});

/* ── 9. allYears / latestYear / prevYear ─────────── */
describe('year helpers', () => {
  beforeEach(reset);

  it('allYears returns sorted unique years across all accounts', () => {
    S.accounts = [
      acc({ id: 'a1', entries: [{ year: 2022, value: 1 }, { year: 2024, value: 2 }] }),
      acc({ id: 'a2', entries: [{ year: 2023, value: 1 }, { year: 2024, value: 2 }] })
    ];
    assert.deepEqual(allYears(), [2022, 2023, 2024]);
  });

  it('latestYear returns NOW when no accounts', () => {
    assert.equal(latestYear(), NOW);
  });

  it('prevYear returns null when only one year', () => {
    S.accounts = [acc({ id: 'a1', entries: [{ year: 2024, value: 1 }] })];
    assert.equal(prevYear(), null);
  });

  it('prevYear returns second-to-last year', () => {
    S.accounts = [acc({ id: 'a1', entries: [{ year: 2022, value: 1 }, { year: 2023, value: 2 }, { year: 2024, value: 3 }] })];
    assert.equal(prevYear(), 2023);
  });
});
