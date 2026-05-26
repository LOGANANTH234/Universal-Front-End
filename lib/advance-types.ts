export interface Advance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  amount: number;
  date: string;
  reason: string;
  status: 'Pending' | 'Partial' | 'Cleared';
  given: number;
  deducted: number;
  remaining: number;
}

export interface AdvanceDeduction {
  month: string;
  deducted: number;
  advanceRef: string;
}

export interface AdvanceSummary {
  totalPending: number;
  employeesWithAdvance: number;
  deductedThisMonth: number;
}

export interface AdvanceHistory {
  advances: Advance[];
  deductions: AdvanceDeduction[];
}
