import type { SampleExpense } from '../shared/contracts.ts';

// Synthetic examples served only by the local-only API. Never seed business DBs.
export const sampleExpenses: SampleExpense[] = [
  { id: 'sample-1', date: '2026-09-01', description: 'サンプル：打ち合わせ資料', business: 'FP事業', amountYen: 1200 },
  { id: 'sample-2', date: '2026-09-02', description: 'サンプル：制作備品', business: '日本デザイン', amountYen: 2800 },
  { id: 'sample-3', date: '2026-09-03', description: 'サンプル：配送費', business: '日本酒', amountYen: 800 },
];
