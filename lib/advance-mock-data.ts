import { Advance, AdvanceDeduction } from './advance-types';

export const mockAdvances: Advance[] = [
  {
    id: 'ADV-001',
    employeeId: 'EMP-001',
    employeeName: 'Arun Kumar',
    employeeCode: 'EMP-001',
    amount: 20000,
    date: '2026-03-15',
    reason: 'Medical emergency',
    status: 'Partial',
    given: 20000,
    deducted: 6000,
    remaining: 12000,
  },
  {
    id: 'ADV-002',
    employeeId: 'EMP-004',
    employeeName: 'Meena Devi',
    employeeCode: 'EMP-004',
    amount: 15000,
    date: '2026-05-10',
    reason: 'Personal needs',
    status: 'Pending',
    given: 15000,
    deducted: 0,
    remaining: 15000,
  },
  {
    id: 'ADV-003',
    employeeId: 'EMP-007',
    employeeName: 'Ravi S.',
    employeeCode: 'EMP-007',
    amount: 10000,
    date: '2026-02-20',
    reason: 'Home renovation',
    status: 'Cleared',
    given: 10000,
    deducted: 10000,
    remaining: 0,
  },
  {
    id: 'ADV-004',
    employeeId: 'EMP-001',
    employeeName: 'Arun Kumar',
    employeeCode: 'EMP-001',
    amount: 5000,
    date: '2026-01-10',
    reason: 'Personal',
    status: 'Cleared',
    given: 5000,
    deducted: 5000,
    remaining: 0,
  },
];

export const mockAdvanceDeductions: AdvanceDeduction[] = [
  {
    month: 'Apr 2026',
    deducted: 5000,
    advanceRef: '15 Mar 2026 advance',
  },
  {
    month: 'Mar 2026',
    deducted: 3000,
    advanceRef: '15 Mar 2026 advance',
  },
  {
    month: 'Feb 2026',
    deducted: 5000,
    advanceRef: '10 Jan 2026 advance',
  },
];

export const getMockAdvanceSummary = (advances: Advance[]) => {
  const totalPending = advances
    .filter((a) => a.status !== 'Cleared')
    .reduce((sum, a) => sum + a.remaining, 0);

  const employeesWithAdvance = new Set(advances.map((a) => a.employeeId)).size;

  const currentMonth = new Date().toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const deductedThisMonth = mockAdvanceDeductions
    .filter((d) => d.month === currentMonth)
    .reduce((sum, d) => sum + d.deducted, 0);

  return {
    totalPending,
    employeesWithAdvance,
    deductedThisMonth,
  };
};
