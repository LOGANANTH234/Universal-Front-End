import { BonusEmployeeItem, BonusCalculationType, WorkdayCriteria, BonusRun, BonusRateMode, WORKDAY_CRITERIA_LABELS } from './bonus-types';

export interface RawAttendanceBreakdown {
  fullDays: number;       // Completed full assigned shift (e.g. 100% of shift hours)
  halfDays: number;       // Completed half shift (e.g. 50% of shift hours)
  shortDays: number;      // Short hours (< 50% of shift hours, e.g. 2 hrs)
  totalHoursWorked: number;
}

export interface MockEmployeeProfile {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation?: string;
  shiftName: string;
  assignedShiftHours: number; // Each employee's regular shift duration
  perDaySalary: number;
  overtimeHours: number;
  overtimePay: number;
  status: 'Pending' | 'Approved' | 'Paid';
  paymentDate?: string;
  paymentMode?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  attendance: RawAttendanceBreakdown;
}

export const mockEmployeeProfiles: MockEmployeeProfile[] = [];

export function calculateTotalDays(
  attendance: RawAttendanceBreakdown,
  criteria: WorkdayCriteria = 'FULL_DAY_ONLY',
  employeeShiftHours = 8
): number {
  switch (criteria) {
    case 'FULL_DAY_ONLY':
      // Only 100% full shift completed counts as 1.0 day
      return attendance.fullDays;

    case 'GREATER_EQUAL_HALF_DAY':
    case 'MORE_THAN_HALF_DAY':
      // Completed greater than or equal to half shift (>=50%) = 1 full day; under half shift = 0
      return attendance.fullDays + attendance.halfDays;

    case 'HALF_AND_FULL_DAY':
      // Full shift = 1.0, Half shift (50%) = 0.5, short hours = 0.25
      return Math.round(
        attendance.fullDays + attendance.halfDays * 0.5 + attendance.shortDays * 0.25
      );

    case 'PROPORTIONAL_HOURS':
      // Total hours worked divided by the employee's OWN regular shift hours
      return Math.round((attendance.totalHoursWorked / employeeShiftHours) * 10) / 10;

    case 'ANY_ATTENDANCE':
      // Any attendance on work day counts as 1 full day regardless of duration
      return attendance.fullDays + attendance.halfDays + attendance.shortDays;

    default:
      return attendance.fullDays + Math.round(attendance.halfDays * 0.5);
  }
}

export function computeBonusItems(
  profiles = mockEmployeeProfiles,
  calculationType: BonusCalculationType = 'ONLY_REGULAR',
  workdayCriteria: WorkdayCriteria = 'HALF_AND_FULL_DAY',
  bonusPercentage = 15,
  rateMode: BonusRateMode = 'FLAT',
  primaryCriteria: WorkdayCriteria = 'HALF_AND_FULL_DAY',
  secondaryCriteria: WorkdayCriteria = 'MORE_THAN_HALF_DAY',
  tier1Percentage = 15,
  tier2Percentage = 10
): BonusEmployeeItem[] {
  return profiles.map((p) => {
    let totalDays = 0;
    let tier1DaysCount = 0;
    let tier2DaysCount = 0;
    let tier1BonusAmount = 0;
    let tier2BonusAmount = 0;
    let bonusAmount = 0;

    if (rateMode === 'TIERED') {
      const daysCriteria1 = calculateTotalDays(p.attendance, primaryCriteria, p.assignedShiftHours);
      const daysCriteria2 = calculateTotalDays(p.attendance, secondaryCriteria, p.assignedShiftHours);

      // Primary criteria takes precedence for its days
      tier1DaysCount = daysCriteria1;
      // Secondary criteria applies to the delta / remaining days that qualify under criteria 2
      tier2DaysCount = Math.max(0, Math.round((daysCriteria2 - daysCriteria1) * 10) / 10);

      // If criteria 2 has fewer total days than criteria 1 (e.g. ANY_ATTENDANCE for primary and FULL_DAY_ONLY for secondary)
      if (daysCriteria2 < daysCriteria1 && daysCriteria2 > 0) {
        tier1DaysCount = Math.max(0, Math.round((daysCriteria1 - daysCriteria2) * 10) / 10);
        tier2DaysCount = daysCriteria2;
      }

      totalDays = Math.round((tier1DaysCount + tier2DaysCount) * 10) / 10;
      tier1BonusAmount = Math.round(tier1DaysCount * p.perDaySalary * (tier1Percentage / 100));
      tier2BonusAmount = Math.round(tier2DaysCount * p.perDaySalary * (tier2Percentage / 100));
      bonusAmount = tier1BonusAmount + tier2BonusAmount;
    } else {
      totalDays = calculateTotalDays(p.attendance, workdayCriteria, p.assignedShiftHours);
      tier1DaysCount = totalDays;
      tier2DaysCount = 0;
      tier1BonusAmount = Math.round(totalDays * p.perDaySalary * (bonusPercentage / 100));
      bonusAmount = tier1BonusAmount;
    }

    const regularSalary = Math.round(totalDays * p.perDaySalary);
    const baseSalary =
      calculationType === 'ONLY_REGULAR'
        ? regularSalary
        : regularSalary + Math.round(p.overtimePay);

    return {
      id: p.id,
      employeeId: p.employeeId,
      employeeName: p.employeeName,
      department: p.department,
      designation: p.designation,
      shiftName: p.shiftName,
      assignedShiftHours: p.assignedShiftHours,
      totalDays,
      perDaySalary: p.perDaySalary,
      regularSalary,
      overtimeHours: p.overtimeHours,
      overtimePay: p.overtimePay,
      baseSalary,
      bonusPercentage: rateMode === 'TIERED' ? tier1Percentage : bonusPercentage,
      bonusAmount,
      status: p.status,
      paymentDate: p.paymentDate,
      paymentMode: p.paymentMode,
      rateMode,
      primaryCriteria,
      secondaryCriteria,
      tier1CriteriaName: WORKDAY_CRITERIA_LABELS[primaryCriteria],
      tier2CriteriaName: WORKDAY_CRITERIA_LABELS[secondaryCriteria],
      tier1DaysCount,
      tier2DaysCount,
      tier1BonusPercentage: tier1Percentage,
      tier2BonusPercentage: tier2Percentage,
      tier1BonusAmount,
      tier2BonusAmount,
      // Backward compatibility aliases
      fullDaysCount: tier1DaysCount,
      halfDaysCount: tier2DaysCount,
      fullDayBonusPercentage: tier1Percentage,
      halfDayBonusPercentage: tier2Percentage,
      fullDaysBonusAmount: tier1BonusAmount,
      halfDaysBonusAmount: tier2BonusAmount,
    };
  });
}

export const mockPreviousBonusRuns: BonusRun[] = [];
