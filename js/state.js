export const ACATS = [
  { id: 'investments', lbl: 'Investments' }, { id: 'crypto', lbl: 'Crypto' },
  { id: 'cash', lbl: 'Cash' }, { id: 'cpf', lbl: 'CPF' },
  { id: 'property', lbl: 'Property' }, { id: 'other', lbl: 'Other' }
];
export const LCATS = [
  { id: 'mortgage', lbl: 'Mortgage' }, { id: 'car_loan', lbl: 'Car Loan' },
  { id: 'credit_card', lbl: 'Credit Card' }, { id: 'personal_loan', lbl: 'Personal' },
  { id: 'student_loan', lbl: 'Student' }, { id: 'other_debt', lbl: 'Other Debt' }
];
export const CCOL = {
  investments: '#2563eb', crypto: '#7c3aed', cash: '#059669', cpf: '#d97706',
  property: '#0891b2', other: '#64748b', mortgage: '#dc2626', car_loan: '#ea580c',
  credit_card: '#e11d48', personal_loan: '#be185d', student_loan: '#7c3aed', other_debt: '#9f1239'
};
export const CBGS = {
  investments: 'var(--bls)', crypto: 'var(--pus)', cash: 'var(--grs)', cpf: 'var(--ams)',
  property: 'var(--cys)', other: 'rgba(100,116,139,.14)', mortgage: 'var(--rds)',
  car_loan: 'rgba(234,88,12,.14)', credit_card: 'var(--rds)', personal_loan: 'var(--rds)',
  student_loan: 'var(--pus)', other_debt: 'var(--rds)'
};
export const CCYS = ['SGD', 'USD', 'EUR', 'GBP', 'MYR', 'AUD', 'HKD', 'CNY', 'JPY'];
export const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DEFFX = { SGD: 1, USD: 1.35, EUR: 1.45, GBP: 1.70, MYR: 0.30, AUD: 0.88, HKD: 0.17, CNY: 0.19, JPY: 0.0090 };
export const NOW = new Date().getFullYear();

export const S = {
  accounts: [],
  milestones: [
    { name: 'Emergency', amount: 30000 }, { name: '$100K', amount: 100000 },
    { name: '$250K', amount: 250000 }, { name: '$500K', amount: 500000 },
    { name: 'Millionaire', amount: 1000000 }
  ],
  fx: { ...DEFFX },
  tfYears: 0, theme: 'dark', cpfOn: true, accrue: true,
  sort: 'value', filter: 'all', showArc: false, proj: false
};
