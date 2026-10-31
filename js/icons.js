export const P = {
  investments: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  crypto: '<circle cx="12" cy="12" r="9"/><path d="M9.5 8h4a2.2 2.2 0 0 1 0 4.4h-4M9.5 12.4h4.6a2.2 2.2 0 0 1 0 4.4H9.5M9.5 8v8.8M11.6 5.6v2.4M11.6 16.8v2.4"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>',
  cpf: '<path d="M3 21h18M4.5 21V10M19.5 21V10M12 3.2 2.5 9h19L12 3.2M8.5 21v-7M15.5 21v-7"/>',
  property: '<path d="M3 10.5 12 3.2l9 7.3"/><path d="M5.2 9.4V21h13.6V9.4"/><path d="M10 21v-6h4v6"/>',
  other: '<path d="M20 12V8a2 2 0 0 0-2-2H5.2a2.2 2.2 0 0 1 0-4.4H18V6"/><path d="M3.2 3.8V18a2 2 0 0 0 2 2H19a2 2 0 0 0 2-2v-4"/><circle cx="17" cy="14" r="1.1" fill="currentColor" stroke="none"/>',
  mortgage: '<path d="M3 10.5 12 3.2l9 7.3"/><path d="M5.2 9.4V21h13.6V9.4"/><path d="M9.6 15.5h4.8M12 13.2v4.6"/>',
  car_loan: '<path d="M4 17h16M2.8 17v-4l2.2-5.2h14L21.2 13v4"/><circle cx="7.4" cy="17.4" r="1.7"/><circle cx="16.6" cy="17.4" r="1.7"/>',
  credit_card: '<rect x="2" y="5" width="20" height="14" rx="2.4"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="14.6" x2="10" y2="14.6"/>',
  personal_loan: '<path d="M14 2.4H6.4a2 2 0 0 0-2 2v15.2a2 2 0 0 0 2 2h11.2a2 2 0 0 0 2-2V8z"/><polyline points="14 2.4 14 8 19.6 8"/><line x1="8.4" y1="13" x2="15" y2="13"/><line x1="8.4" y1="17" x2="13" y2="17"/>',
  student_loan: '<path d="M21.6 9.6 12 4.8 2.4 9.6 12 14.4l9.6-4.8z"/><path d="M6.4 11.8v4.6c0 1.5 2.5 2.8 5.6 2.8s5.6-1.3 5.6-2.8v-4.6"/>',
  other_debt: '<line x1="6" y1="20" x2="6" y2="12.5"/><line x1="12" y1="20" x2="12" y2="5.5"/><line x1="18" y1="20" x2="18" y2="14.5"/><line x1="3" y1="20" x2="21" y2="20"/>'
};

export const ic = (k, s = 14, w = 2.1) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[k] || P.other}</svg>`;
