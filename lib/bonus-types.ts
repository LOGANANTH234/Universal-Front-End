export type BonusCalculationType = 'ONLY_REGULAR' | 'REGULAR_AND_OT';

export type WorkdayCriteria =
  | 'FULL_DAY_ONLY'
  | 'GREATER_EQUAL_HALF_DAY'
  | 'PROPORTIONAL_HOURS'
  | 'ANY_ATTENDANCE'
  | 'HALF_AND_FULL_DAY' // legacy support
  | 'MORE_THAN_HALF_DAY'; // legacy support

export const WORKDAY_CRITERIA_LABELS: Record<WorkdayCriteria, string> = {
  FULL_DAY_ONLY: 'Full Day Only',
  GREATER_EQUAL_HALF_DAY: 'Greater or Equal to Half Day',
  MORE_THAN_HALF_DAY: 'Greater or Equal to Half Day',
  HALF_AND_FULL_DAY: 'Full Day Only',
  PROPORTIONAL_HOURS: 'Proportional Hours',
  ANY_ATTENDANCE: 'Any Attendance',
};

export type BonusStatus = 'Pending' | 'Approved' | 'Paid';

export type BonusRateMode = 'FLAT' | 'TIERED';

export interface BonusEmployeeItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation?: string;
  assignedShiftHours: number;
  shiftName?: string;
  totalDays: number;
  perDaySalary: number;
  regularSalary: number;
  overtimeHours: number;
  overtimePay: number;
  baseSalary: number;
  bonusPercentage: number;
  bonusAmount: number;
  status?: BonusStatus;
  paymentDate?: string;
  paymentMode?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  remarks?: string;
  // Dual / Tiered criteria details
  rateMode?: BonusRateMode;
  primaryCriteria?: WorkdayCriteria;
  secondaryCriteria?: WorkdayCriteria;
  tier1CriteriaName?: string;
  tier2CriteriaName?: string;
  tier1DaysCount?: number;
  tier2DaysCount?: number;
  tier1BonusPercentage?: number;
  tier2BonusPercentage?: number;
  tier1BonusAmount?: number;
  tier2BonusAmount?: number;
  // Backward compatibility aliases
  fullDaysCount?: number;
  halfDaysCount?: number;
  fullDayBonusPercentage?: number;
  halfDayBonusPercentage?: number;
  fullDaysBonusAmount?: number;
  halfDaysBonusAmount?: number;
}

export interface BonusRun {
  id: string;
  bonusName: string;
  fromDate: string;
  toDate: string;
  calculationType: BonusCalculationType;
  workdayCriteria: WorkdayCriteria;
  rateMode?: BonusRateMode;
  primaryCriteria?: WorkdayCriteria;
  secondaryCriteria?: WorkdayCriteria;
  bonusPercentage: number;
  tier1Percentage?: number;
  tier2Percentage?: number;
  totalEmployees: number;
  totalBonusAmount: number;
  status?: 'Draft' | 'Approved' | 'Paid';
  createdAt: string;
  items: BonusEmployeeItem[];
}

export interface BonusFilterState {
  searchQuery: string;
  department: string;
  status: string;
}
