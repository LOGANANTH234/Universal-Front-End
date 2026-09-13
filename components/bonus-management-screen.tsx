'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Coins,
  Printer,
  Calendar,
  Search,
  CheckCircle2,
  Layers,
  Sparkles,
  DollarSign,
  Users,
  TrendingUp,
  FileSpreadsheet,
  CheckSquare,
  HelpCircle,
  Info,
  Save,
  History,
  FolderArchive,
  Trash2,
  Eye,
  Gift,
  X,
  Loader2,
  RotateCw,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MultiViewCalendar } from './multi-view-calendar';
import { format, parseISO } from 'date-fns';
import { API_BASE_URL } from '@/lib/branding-config';
import { useAuth } from '@/lib/contexts/auth-context';
import { useBonusCache } from '@/lib/contexts/bonus-cache-context';
import {
  BonusEmployeeItem,
  BonusRateMode,
  BonusRun,
  WorkdayCriteria,
  WORKDAY_CRITERIA_LABELS,
} from '@/lib/bonus-types';
import { BonusSlipModal } from './bonus-slip-modal';
import { PageLoader } from '@/components/ui/page-loader';

// Date Parsing and Formatting Helpers for MultiViewCalendar
const parseIsoDate = (str: string): Date => {
  if (!str) return new Date();
  const parts = str.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date();
};

const formatIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (str: string): string => {
  try {
    const d = parseIsoDate(str);
    return format(d, 'dd/MM/yyyy');
  } catch {
    return str;
  }
};

export const formatDays = (n: number | null | undefined): string => {
  if (n == null || isNaN(Number(n))) return '0';
  const val = Math.round(Number(n) * 100) / 100;
  return Number.isInteger(val) ? val.toString() : val.toFixed(2);
};

export const formatSavedDateTime = (str: string | null | undefined): string => {
  if (!str) return '—';
  try {
    const d = parseISO(str);
    if (isNaN(d.getTime())) {
      const fallback = new Date(str);
      if (!isNaN(fallback.getTime())) {
        return format(fallback, 'dd/MM/yyyy, hh:mm a');
      }
      return str;
    }
    if (!str.includes('T') && !str.includes(':')) {
      return format(d, 'dd/MM/yyyy');
    }
    return format(d, 'dd/MM/yyyy, hh:mm a');
  } catch {
    return str;
  }
};

export function BonusManagementScreen() {
  const bonusCache = useBonusCache();

  // Active Tab: 'CALCULATE' | 'SAVED_HISTORY'
  const [activeTab, setActiveTab] = useState<'CALCULATE' | 'SAVED_HISTORY'>(
    bonusCache.activeCalculation?.activeTab || 'CALCULATE'
  );

  // Saved Runs State (initialized with cached runs if available)
  const [savedRuns, setSavedRuns] = useState<BonusRun[]>(bonusCache.savedRuns || []);

  // Success alert message
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ type: 'warning' | 'error' | 'info'; text: string } | null>(null);

  // In-app modal prompt for Bonus Name (replaces native browser alert)
  const [isPromptNameDialogOpen, setIsPromptNameDialogOpen] = useState<boolean>(false);
  const [promptNameInput, setPromptNameInput] = useState<string>('');
  const [promptNameError, setPromptNameError] = useState<string | null>(null);

  // Config form state (restored from active calculation cache if present)
  const [bonusName, setBonusName] = useState<string>(bonusCache.activeCalculation?.bonusName || '');
  const [fromDate, setFromDate] = useState<string>(bonusCache.activeCalculation?.fromDate || '2026-01-01');
  const [toDate, setToDate] = useState<string>(bonusCache.activeCalculation?.toDate || '2026-12-31');
  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState<boolean>(false);
  const [isToCalendarOpen, setIsToCalendarOpen] = useState<boolean>(false);
  const [isDualFromCalendarOpen, setIsDualFromCalendarOpen] = useState<boolean>(false);
  const [isDualToCalendarOpen, setIsDualToCalendarOpen] = useState<boolean>(false);
  const [workdayCriteria, setWorkdayCriteria] = useState<WorkdayCriteria>(
    bonusCache.activeCalculation?.workdayCriteria || 'FULL_DAY_ONLY'
  );
  const [primaryCriteria, setPrimaryCriteria] = useState<WorkdayCriteria>(
    bonusCache.activeCalculation?.primaryCriteria || 'FULL_DAY_ONLY'
  );
  const [secondaryCriteria, setSecondaryCriteria] = useState<WorkdayCriteria>(
    bonusCache.activeCalculation?.secondaryCriteria || 'GREATER_EQUAL_HALF_DAY'
  );
  const [rateMode, setRateMode] = useState<BonusRateMode>(
    bonusCache.activeCalculation?.rateMode || 'FLAT'
  );
  const [bonusPercentage, setBonusPercentage] = useState<number>(
    bonusCache.activeCalculation?.bonusPercentage ?? 15
  );
  const [tier1Percentage, setTier1Percentage] = useState<number>(
    bonusCache.activeCalculation?.tier1Percentage ?? 15
  );
  const [tier2Percentage, setTier2Percentage] = useState<number>(
    bonusCache.activeCalculation?.tier2Percentage ?? 10
  );

  // Local draft inputs so values are only committed and recalculated on blur or Enter
  const [rateInputDraft, setRateInputDraft] = useState<string>(
    String(bonusCache.activeCalculation?.bonusPercentage ?? 15)
  );
  const [tier1InputDraft, setTier1InputDraft] = useState<string>(
    String(bonusCache.activeCalculation?.tier1Percentage ?? 15)
  );
  const [tier2InputDraft, setTier2InputDraft] = useState<string>(
    String(bonusCache.activeCalculation?.tier2Percentage ?? 10)
  );

  // Criteria explanation modal state
  const [criteriaModalOpen, setCriteriaModalOpen] = useState<boolean>(false);

  // Delete run confirmation modal state
  const [runToDelete, setRunToDelete] = useState<BonusRun | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');

  // Employee list state (restored from cache if already calculated, otherwise empty)
  const [employees, setEmployees] = useState<BonusEmployeeItem[]>(
    bonusCache.activeCalculation?.employees || []
  );

  const { auth } = useAuth();
  const [isLoadingBonus, setIsLoadingBonus] = useState<boolean>(false);
  const [loadingTitle, setLoadingTitle] = useState<string>('Calculating Bonus...');
  const [loadingDesc, setLoadingDesc] = useState<string>('Evaluating employee attendance days, shift hours, and regular salaries…');
  const [isSavingBonus, setIsSavingBonus] = useState<boolean>(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Selected employee for printing bonus slip
  const [slipModalOpen, setSlipModalOpen] = useState<boolean>(false);
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = useState<BonusEmployeeItem | null>(null);

  useEffect(() => {
    setRateInputDraft(String(bonusPercentage));
  }, [bonusPercentage]);

  useEffect(() => {
    setTier1InputDraft(String(tier1Percentage));
  }, [tier1Percentage]);

  useEffect(() => {
    setTier2InputDraft(String(tier2Percentage));
  }, [tier2Percentage]);

  // Synchronize local savedRuns whenever bonusCache.savedRuns changes
  useEffect(() => {
    if (bonusCache.savedRuns) {
      setSavedRuns(bonusCache.savedRuns);
    }
  }, [bonusCache.savedRuns]);

  // Synchronize current working calculation / inputs to bonusCache
  useEffect(() => {
    bonusCache.setActiveCalculation({
      bonusName,
      fromDate,
      toDate,
      workdayCriteria,
      primaryCriteria,
      secondaryCriteria,
      rateMode,
      bonusPercentage,
      tier1Percentage,
      tier2Percentage,
      employees,
      activeTab,
    });
  }, [
    bonusName,
    fromDate,
    toDate,
    workdayCriteria,
    primaryCriteria,
    secondaryCriteria,
    rateMode,
    bonusPercentage,
    tier1Percentage,
    tier2Percentage,
    employees,
    activeTab,
  ]);

  // Helper to map backend DTO to BonusEmployeeItem
  const mapBackendEmployeeToItem = (
    dto: any,
    mode: BonusRateMode,
    primCrit: WorkdayCriteria,
    secCrit: WorkdayCriteria,
    t1Pct: number,
    t2Pct: number
  ): BonusEmployeeItem => {
    const rawEligibleDays = dto.eligibleDays != null ? Number(dto.eligibleDays) : 0;
    const roundedDays = Math.round(rawEligibleDays * 100) / 100;
    const t1Days = dto.tier1Days != null ? Math.round(Number(dto.tier1Days) * 100) / 100 : 0;
    const t2Days = dto.tier2Days != null ? Math.round(Number(dto.tier2Days) * 100) / 100 : 0;

    return {
      id: String(dto.employeeId),
      employeeId: String(dto.employeeId),
      employeeName: dto.employeeName || 'Employee',
      department: dto.department || 'General',
      assignedShiftHours: Number(dto.assignedShiftHours || 8),
      totalDays: roundedDays,
      perDaySalary: Number(dto.dailyRate != null ? dto.dailyRate : 0),
      regularSalary: Number(dto.totalEligibleWages != null ? dto.totalEligibleWages : 0),
      overtimeHours: 0,
      overtimePay: 0,
      baseSalary: Number(dto.totalEligibleWages != null ? dto.totalEligibleWages : 0),
      bonusPercentage: Number(dto.bonusPercentage != null ? dto.bonusPercentage : 15),
      bonusAmount: Number(dto.bonusAmount != null ? dto.bonusAmount : 0),
      rateMode: mode,
      primaryCriteria: primCrit,
      secondaryCriteria: secCrit,
      tier1DaysCount: t1Days,
      tier2DaysCount: t2Days,
      tier1BonusPercentage: t1Pct,
      tier2BonusPercentage: t2Pct,
      tier1BonusAmount: dto.tier1Amount || 0,
      tier2BonusAmount: dto.tier2Amount || 0,
      fullDaysCount: t1Days || roundedDays || 0,
      halfDaysCount: t2Days || 0,
      fullDayBonusPercentage: t1Pct,
      halfDayBonusPercentage: t2Pct,
      fullDaysBonusAmount: dto.tier1Amount || dto.bonusAmount || 0,
      halfDaysBonusAmount: dto.tier2Amount || 0,
    };
  };

  // Recalculate with new parameters using Backend API (with fallback)
  const handleRecalculate = async (
    newCriteria: WorkdayCriteria = workdayCriteria,
    newPercentage: number = bonusPercentage,
    newRateMode: BonusRateMode = rateMode,
    newPrimaryCrit: WorkdayCriteria = primaryCriteria,
    newSecondaryCrit: WorkdayCriteria = secondaryCriteria,
    newTier1Pct: number = tier1Percentage,
    newTier2Pct: number = tier2Percentage,
    currentFrom: string = fromDate,
    currentTo: string = toDate,
    currentBonusName?: string
  ): Promise<BonusEmployeeItem[]> => {
    const effectiveName = (currentBonusName !== undefined ? currentBonusName : bonusName).trim();
    if (!effectiveName) {
      setEmployees([]);
      setIsLoadingBonus(false);
      return [];
    }

    try {
      setIsLoadingBonus(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;

      const res = await fetch(`${API_BASE_URL}/api/bonus/calculate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bonusName: effectiveName,
          fromDate: currentFrom,
          toDate: currentTo,
          workdayCriteria: newCriteria,
          rateMode: newRateMode,
          bonusPercentage: newPercentage,
          primaryCriteria: newPrimaryCrit,
          secondaryCriteria: newSecondaryCrit,
          tier1Percentage: newTier1Pct,
          tier2Percentage: newTier2Pct,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.employees) && data.employees.length > 0) {
          const items = data.employees.map((e: any) =>
            mapBackendEmployeeToItem(e, newRateMode, newPrimaryCrit, newSecondaryCrit, newTier1Pct, newTier2Pct)
          );
          setEmployees(items);
          return items;
        }
      }
      setEmployees([]);
      return [];
    } catch (err) {
      console.warn('Backend bonus calculate call failed:', err);
      setEmployees([]);
      return [];
    } finally {
      setIsLoadingBonus(false);
    }
  };

  // Commit and calculate only when user finishes typing bonus name (Enter or blur)
  const handleCommitBonusName = (nameToCommit?: string) => {
    const name = nameToCommit !== undefined ? nameToCommit : bonusName;
    const trimmed = name.trim();
    if (trimmed) {
      setLoadingTitle('Calculating Bonus...');
      setLoadingDesc(`Calculating bonus for "${trimmed}" across employee attendance records…`);
      handleRecalculate(
        workdayCriteria,
        bonusPercentage,
        rateMode,
        primaryCriteria,
        secondaryCriteria,
        tier1Percentage,
        tier2Percentage,
        fromDate,
        toDate,
        trimmed
      );
    } else {
      setEmployees([]);
    }
  };

  // Fetch saved runs from backend once, then cache
  const fetchRunsFromBackend = async (forceRefresh = false) => {
    if (bonusCache.hasLoadedRuns && !forceRefresh) {
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
      const res = await fetch(`${API_BASE_URL}/api/bonus/runs`, { headers });
      if (res.ok) {
        const runsData = await res.json();
        if (Array.isArray(runsData)) {
          const mappedRuns: BonusRun[] = runsData.map((r: any) => ({
            id: String(r.id),
            bonusName: r.bonusName,
            fromDate: r.fromDate,
            toDate: r.toDate,
            calculationType: 'ONLY_REGULAR',
            workdayCriteria: r.workdayCriteria,
            rateMode: r.rateMode || 'FLAT',
            primaryCriteria: r.primaryCriteria,
            secondaryCriteria: r.secondaryCriteria,
            bonusPercentage: r.bonusPercentage || 15,
            tier1Percentage: r.tier1Percentage,
            tier2Percentage: r.tier2Percentage,
            totalEmployees: r.totalEmployees,
            totalBonusAmount: Number(r.totalBonusAmount || 0),
            createdAt: r.createdAt ? String(r.createdAt) : new Date().toISOString(),
            items: [],
          }));
          bonusCache.setSavedRuns(mappedRuns);
          setSavedRuns(mappedRuns);
        }
      }
    } catch (err) {
      console.warn('Could not fetch runs from backend:', err);
    }
  };

  useEffect(() => {
    fetchRunsFromBackend();
  }, [auth?.token, bonusCache.hasLoadedRuns]);

  const onFromDateChange = (newFrom: string) => {
    setFromDate(newFrom);
    if (bonusName.trim()) {
      setLoadingTitle('Updating Bonus Period...');
      setLoadingDesc(`Re-evaluating attendance from ${formatDisplayDate(newFrom)} to ${formatDisplayDate(toDate)}…`);
      handleRecalculate(workdayCriteria, bonusPercentage, rateMode, primaryCriteria, secondaryCriteria, tier1Percentage, tier2Percentage, newFrom, toDate);
    }
  };

  const onToDateChange = (newTo: string) => {
    setToDate(newTo);
    if (bonusName.trim()) {
      setLoadingTitle('Updating Bonus Period...');
      setLoadingDesc(`Re-evaluating attendance from ${formatDisplayDate(fromDate)} to ${formatDisplayDate(newTo)}…`);
      handleRecalculate(workdayCriteria, bonusPercentage, rateMode, primaryCriteria, secondaryCriteria, tier1Percentage, tier2Percentage, fromDate, newTo);
    }
  };

  const onWorkdayCriteriaChange = (val: WorkdayCriteria) => {
    setWorkdayCriteria(val);
    if (bonusName.trim()) {
      setLoadingTitle('Applying Day Criteria...');
      setLoadingDesc(`Re-evaluating attendance matching "${WORKDAY_CRITERIA_LABELS[val]}" rules…`);
      handleRecalculate(val, bonusPercentage, rateMode, primaryCriteria, secondaryCriteria, tier1Percentage, tier2Percentage);
    }
  };

  const onPrimaryCriteriaChange = (val: WorkdayCriteria) => {
    setPrimaryCriteria(val);
    if (bonusName.trim()) {
      setLoadingTitle('Updating Primary Criteria...');
      setLoadingDesc(`Evaluating days matching "${WORKDAY_CRITERIA_LABELS[val]}"…`);
      handleRecalculate(workdayCriteria, bonusPercentage, rateMode, val, secondaryCriteria, tier1Percentage, tier2Percentage);
    }
  };

  const onSecondaryCriteriaChange = (val: WorkdayCriteria) => {
    setSecondaryCriteria(val);
    if (bonusName.trim()) {
      setLoadingTitle('Updating Secondary Criteria...');
      setLoadingDesc(`Evaluating days matching "${WORKDAY_CRITERIA_LABELS[val]}"…`);
      handleRecalculate(workdayCriteria, bonusPercentage, rateMode, primaryCriteria, val, tier1Percentage, tier2Percentage);
    }
  };

  const commitBonusRate = () => {
    const parsed = parseFloat(rateInputDraft);
    const val = isNaN(parsed) || parsed < 0 ? 0 : parsed > 100 ? 100 : Math.round(parsed * 100) / 100;
    setRateInputDraft(String(val));
    if (val !== bonusPercentage) {
      setBonusPercentage(val);
      if (bonusName.trim()) {
        setLoadingTitle('Applying Bonus Rate...');
        setLoadingDesc(`Recalculating bonus amounts at ${val}%…`);
        handleRecalculate(workdayCriteria, val, rateMode, primaryCriteria, secondaryCriteria, tier1Percentage, tier2Percentage);
      }
    }
  };

  const onRateModeChange = (mode: BonusRateMode) => {
    setRateMode(mode);
    if (bonusName.trim()) {
      setLoadingTitle(mode === 'TIERED' ? 'Switching to Dual Criteria...' : 'Switching to Single Rate...');
      setLoadingDesc('Updating calculation rules and recalculating payout amounts…');
      handleRecalculate(workdayCriteria, bonusPercentage, mode, primaryCriteria, secondaryCriteria, tier1Percentage, tier2Percentage);
    }
  };

  const commitTier1Rate = () => {
    const parsed = parseFloat(tier1InputDraft);
    const val = isNaN(parsed) || parsed < 0 ? 0 : parsed > 100 ? 100 : Math.round(parsed * 100) / 100;
    setTier1InputDraft(String(val));
    if (val !== tier1Percentage) {
      setTier1Percentage(val);
      if (bonusName.trim()) {
        setLoadingTitle('Applying Tier 1 Rate...');
        setLoadingDesc(`Recalculating bonus amounts with Tier 1 at ${val}%…`);
        handleRecalculate(workdayCriteria, bonusPercentage, rateMode, primaryCriteria, secondaryCriteria, val, tier2Percentage);
      }
    }
  };

  const commitTier2Rate = () => {
    const parsed = parseFloat(tier2InputDraft);
    const val = isNaN(parsed) || parsed < 0 ? 0 : parsed > 100 ? 100 : Math.round(parsed * 100) / 100;
    setTier2InputDraft(String(val));
    if (val !== tier2Percentage) {
      setTier2Percentage(val);
      if (bonusName.trim()) {
        setLoadingTitle('Applying Tier 2 Rate...');
        setLoadingDesc(`Recalculating bonus amounts with Tier 2 at ${val}%…`);
        handleRecalculate(workdayCriteria, bonusPercentage, rateMode, primaryCriteria, secondaryCriteria, tier1Percentage, val);
      }
    }
  };

  // Open single employee slip modal
  const handleOpenSlip = (emp: BonusEmployeeItem) => {
    setSelectedEmployeeForSlip(emp);
    setSlipModalOpen(true);
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept =
        selectedDepartment === 'ALL' || emp.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, selectedDepartment]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => set.add(e.department));
    return Array.from(set);
  }, [employees]);

  const computeMetrics = (list: BonusEmployeeItem[]) => {
    const totalBonus = list.reduce((sum, e) => sum + e.bonusAmount, 0);
    const totalBaseSalary = list.reduce((sum, e) => sum + e.baseSalary, 0);
    const avgBonus = list.length > 0 ? Math.round(totalBonus / list.length) : 0;

    return {
      totalBonus,
      totalBaseSalary,
      avgBonus,
      totalEmployees: list.length,
    };
  };

  // Metrics summary
  const metrics = useMemo(() => computeMetrics(employees), [employees]);

  // Export to CSV
  const handleExportCSV = async () => {
    let targetEmployees = filteredEmployees;

    if (targetEmployees.length === 0) {
      const currentName = bonusName.trim();
      if (!currentName) {
        setNoticeMessage({
          type: 'warning',
          text: 'Please enter a Bonus Name in the Live Bonus Calculator before exporting CSV.',
        });
        return;
      }
      setLoadingTitle('Calculating Bonus...');
      setLoadingDesc(`Calculating bonus for "${currentName}" before exporting CSV…`);
      const calculated = await handleRecalculate(
        workdayCriteria,
        bonusPercentage,
        rateMode,
        primaryCriteria,
        secondaryCriteria,
        tier1Percentage,
        tier2Percentage,
        fromDate,
        toDate,
        currentName
      );
      targetEmployees = calculated;
    }

    if (!targetEmployees || targetEmployees.length === 0) {
      setNoticeMessage({
        type: 'warning',
        text: 'No calculated employee records available to export. Please check the period and parameters.',
      });
      return;
    }

    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Assigned Shift',
      'Total Days Worked',
      'Per Day Salary',
      'Total Salary',
      'Bonus Percentage',
      'Bonus Amount',
    ];

    const rows = targetEmployees.map((e) => [
      e.employeeId,
      e.employeeName,
      e.department,
      `${e.assignedShiftHours}h Shift`,
      formatDays(e.totalDays),
      e.perDaySalary,
      e.regularSalary,
      rateMode === 'TIERED'
        ? `"Full: ${e.fullDayBonusPercentage}%, Half: ${e.halfDayBonusPercentage}%"`
        : `${e.bonusPercentage}%`,
      e.bonusAmount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(bonusName.trim() || 'Bonus').replace(/\s+/g, '_')}_Calculations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execute Save for a given bonus name and list of employees
  const executeSaveForName = async (nameToSave: string, existingEmployees: BonusEmployeeItem[]) => {
    let targetEmployees = existingEmployees;

    // If employees haven't been calculated yet for this bonus name, calculate first!
    if (!targetEmployees || targetEmployees.length === 0) {
      setLoadingTitle('Calculating Bonus...');
      setLoadingDesc(`Calculating bonus for "${nameToSave}" across employee attendance records…`);
      targetEmployees = await handleRecalculate(
        workdayCriteria,
        bonusPercentage,
        rateMode,
        primaryCriteria,
        secondaryCriteria,
        tier1Percentage,
        tier2Percentage,
        fromDate,
        toDate,
        nameToSave
      );
    }

    if (!targetEmployees || targetEmployees.length === 0) {
      setNoticeMessage({
        type: 'warning',
        text: `No employee attendance records found for "${nameToSave}" in the period ${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}. Please verify the date range.`,
      });
      return;
    }

    const targetMetrics = computeMetrics(targetEmployees);

    setIsSavingBonus(true);
    setLoadingTitle('Saving Bonus Run...');
    setLoadingDesc(`Archiving "${nameToSave}" and ${targetEmployees.length} employee records to database…`);
    const newRunId = `RUN-${new Date().getFullYear()}-${String(savedRuns.length + 1).padStart(2, '0')}`;
    const payload = {
      runCode: newRunId,
      bonusName: nameToSave,
      fromDate,
      toDate,
      calculationType: 'ONLY_REGULAR',
      workdayCriteria,
      rateMode,
      primaryCriteria,
      secondaryCriteria,
      bonusPercentage,
      tier1Percentage,
      tier2Percentage,
      totalEmployees: targetEmployees.length,
      totalBonusAmount: targetMetrics.totalBonus,
      totalBaseSalary: targetMetrics.totalBaseSalary,
      averageBonus: targetMetrics.avgBonus,
      items: targetEmployees.map((e) => ({
        employeeId: e.employeeId,
        employeeName: e.employeeName,
        department: e.department,
        designation: e.designation || 'Staff',
        eligibleDays: Math.round(e.totalDays * 100) / 100,
        dailyRate: e.perDaySalary,
        totalEligibleWages: e.regularSalary,
        bonusPercentage: e.bonusPercentage,
        bonusAmount: e.bonusAmount,
        tier1Days: Math.round((e.tier1DaysCount || 0) * 100) / 100,
        tier1Amount: e.tier1BonusAmount,
        tier2Days: Math.round((e.tier2DaysCount || 0) * 100) / 100,
        tier2Amount: e.tier2BonusAmount,
        calculationDetails: `${formatDays(e.totalDays)} days × ₹${e.perDaySalary}/day × ${e.bonusPercentage}%`,
      })),
    };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;

      const res = await fetch(`${API_BASE_URL}/api/bonus/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedEntity = await res.json();
        const createdRun: BonusRun = {
          id: String(savedEntity.id || savedEntity.runCode || newRunId),
          bonusName: savedEntity.bonusName || nameToSave,
          fromDate: savedEntity.fromDate || fromDate,
          toDate: savedEntity.toDate || toDate,
          calculationType: 'ONLY_REGULAR',
          workdayCriteria: savedEntity.workdayCriteria || workdayCriteria,
          rateMode: savedEntity.rateMode || rateMode,
          primaryCriteria: savedEntity.primaryCriteria || primaryCriteria,
          secondaryCriteria: savedEntity.secondaryCriteria || secondaryCriteria,
          bonusPercentage: savedEntity.bonusPercentage || bonusPercentage,
          tier1Percentage: savedEntity.tier1Percentage || tier1Percentage,
          tier2Percentage: savedEntity.tier2Percentage || tier2Percentage,
          totalEmployees: savedEntity.totalEmployees || targetEmployees.length,
          totalBonusAmount: Number(savedEntity.totalBonusAmount || targetMetrics.totalBonus),
          createdAt: savedEntity.createdAt ? String(savedEntity.createdAt) : new Date().toISOString(),
          items: [...targetEmployees],
        };
        setSavedRuns((prev) => [createdRun, ...prev.filter((r) => r.id !== createdRun.id)]);
        bonusCache.addSavedRun(createdRun);
        setNoticeMessage(null);
        setSaveSuccessMessage(`"${createdRun.bonusName}" (₹${targetMetrics.totalBonus.toLocaleString('en-IN')}) successfully saved to Backend Database!`);
        setTimeout(() => setSaveSuccessMessage(null), 4500);
        return;
      }
    } catch (err) {
      console.warn('Backend bonus save failed, saving locally:', err);
    } finally {
      setIsSavingBonus(false);
    }

    // Local fallback
    const localRun: BonusRun = {
      id: newRunId,
      bonusName: nameToSave || 'ANNUAL BONUS',
      fromDate,
      toDate,
      calculationType: 'ONLY_REGULAR',
      workdayCriteria,
      rateMode,
      primaryCriteria,
      secondaryCriteria,
      bonusPercentage,
      tier1Percentage,
      tier2Percentage,
      totalEmployees: targetEmployees.length,
      totalBonusAmount: targetMetrics.totalBonus,
      createdAt: new Date().toISOString(),
      items: [...targetEmployees],
    };
    setSavedRuns((prev) => [localRun, ...prev]);
    bonusCache.addSavedRun(localRun);
    setNoticeMessage(null);
    setSaveSuccessMessage(`"${localRun.bonusName}" (₹${targetMetrics.totalBonus.toLocaleString('en-IN')}) successfully saved!`);
    setTimeout(() => setSaveSuccessMessage(null), 4500);
  };

  // Save current calculation run to history with Backend Persistence
  const handleSaveCurrentBonus = async () => {
    const currentName = bonusName.trim();
    if (!currentName) {
      setPromptNameInput('');
      setPromptNameError(null);
      setIsPromptNameDialogOpen(true);
      return;
    }

    await executeSaveForName(currentName, employees);
  };

  // Handler when user submits bonus name from the modal dialog
  const handlePromptSaveSubmit = async () => {
    const trimmed = promptNameInput.trim().toUpperCase();
    if (!trimmed) {
      setPromptNameError('Please enter a Bonus Name.');
      return;
    }
    setBonusName(trimmed);
    setIsPromptNameDialogOpen(false);
    await executeSaveForName(trimmed, []);
  };

  // Load a previously saved run into the active view (uses cache first)
  const handleLoadSavedRun = async (run: BonusRun) => {
    setIsLoadingBonus(true);
    setLoadingTitle('Loading Saved Bonus Run...');
    setLoadingDesc(`Loading archive "${run.bonusName}" and employee vouchers…`);
    try {
      setBonusName(run.bonusName);
      setFromDate(run.fromDate);
      setToDate(run.toDate);
      setWorkdayCriteria(run.workdayCriteria);
      setRateMode(run.rateMode || 'FLAT');
      if (run.primaryCriteria) setPrimaryCriteria(run.primaryCriteria);
      if (run.secondaryCriteria) setSecondaryCriteria(run.secondaryCriteria);
      if (run.bonusPercentage) setBonusPercentage(run.bonusPercentage);
      if (run.tier1Percentage) setTier1Percentage(run.tier1Percentage);
      if (run.tier2Percentage) setTier2Percentage(run.tier2Percentage);

      // Check if details are already in cache
      const cached = bonusCache.getRunDetails(run.id);
      if (cached && cached.items && cached.items.length > 0) {
        setEmployees(cached.items);
        setActiveTab('CALCULATE');
        return;
      }

      // If items are not loaded, fetch run details from backend
      if (!run.items || run.items.length === 0) {
        const headers: Record<string, string> = {};
        if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
        const res = await fetch(`${API_BASE_URL}/api/bonus/runs/${run.id}`, { headers });
        if (res.ok) {
          const runDetail = await res.json();
          if (runDetail && Array.isArray(runDetail.items)) {
            const mappedItems = runDetail.items.map((e: any) =>
              mapBackendEmployeeToItem(e, run.rateMode || 'FLAT', run.primaryCriteria || 'FULL_DAY_ONLY', run.secondaryCriteria || 'GREATER_EQUAL_HALF_DAY', run.tier1Percentage || 15, run.tier2Percentage || 10)
            );
            setEmployees(mappedItems);
            const detailed = { ...run, items: mappedItems };
            bonusCache.cacheRunDetails(run.id, detailed);
            bonusCache.updateSavedRun(detailed);
            setActiveTab('CALCULATE');
            return;
          }
        }
      } else {
        setEmployees(run.items);
        bonusCache.cacheRunDetails(run.id, run);
      }
      setActiveTab('CALCULATE');
    } catch (err) {
      console.warn('Could not fetch run details from backend:', err);
    } finally {
      setIsLoadingBonus(false);
    }
  };

  // Delete a saved run from backend, local state, and cache
  const handleConfirmDeleteRun = async () => {
    if (!runToDelete) return;
    const runId = runToDelete.id;
    const runName = runToDelete.bonusName;
    setRunToDelete(null);
    setIsLoadingBonus(true);
    setLoadingTitle('Deleting Saved Run...');
    setLoadingDesc(`Permanently removing "${runName}" and archived records…`);
    try {
      const headers: Record<string, string> = {};
      if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
      await fetch(`${API_BASE_URL}/api/bonus/runs/${runId}`, {
        method: 'DELETE',
        headers,
      });
      setSavedRuns((prev) => prev.filter((r) => r.id !== runId));
      bonusCache.deleteSavedRun(runId);
      setSaveSuccessMessage(`"${runName}" successfully deleted.`);
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    } catch (err) {
      console.warn('Backend delete failed:', err);
    } finally {
      setIsLoadingBonus(false);
    }
  };

  return (
    <div className="w-full space-y-6 px-6 py-6 relative">
      {/* Page Loader Overlay for Calculation / Data Operations */}
      <PageLoader
        isLoading={isLoadingBonus || isSavingBonus}
        title={loadingTitle}
        description={loadingDesc}
        accentColor="amber"
      />

      {/* Top Header Bar - Matches Leave & Holiday Screen Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Bonus Management
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Calculate, configure criteria, approve, and print employee festival/annual bonus vouchers (Regular Shift Salary)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 px-3 gap-1.5 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={handleSaveCurrentBonus}
            className="h-9 px-3.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-all text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Save This Bonus Run
          </Button>
        </div>
      </div>

      {/* Notice Banner - Matches Leave Management Notice Bar */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-lg border flex items-center justify-between text-sm bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 transition-all">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('SAVED_HISTORY')}
              className="text-xs font-bold underline hover:text-emerald-950 dark:hover:text-emerald-100 cursor-pointer"
            >
              View in Saved History →
            </button>
            <button
              onClick={() => setSaveSuccessMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {noticeMessage && (
        <div className={`p-3.5 rounded-lg border flex items-center justify-between text-sm transition-all ${
          noticeMessage.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-center gap-2 font-medium">
            <Info className="w-4 h-4 shrink-0" />
            <span>{noticeMessage.text}</span>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs Bar - Matches Leave Management Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-slate-800/80 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('CALCULATE')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'CALCULATE'
                ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>Live Bonus Calculator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SAVED_HISTORY')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'SAVED_HISTORY'
                ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Saved Bonus History</span>
            {savedRuns.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                {savedRuns.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">
          {activeTab === 'CALCULATE'
            ? `Active calculation (${employees.length} employees)`
            : `${savedRuns.length} saved bonus run(s) archived`}
        </div>
      </div>

      {/* Tab 1: Saved Bonus History */}
      {activeTab === 'SAVED_HISTORY' ? (
        <div className="space-y-6">
          {/* History KPI Cards - Matches Application Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Total Saved Runs
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {savedRuns.length}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  Archived calculation runs
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <FolderArchive className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Cumulative Payout
                </p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  ₹{savedRuns.reduce((sum, r) => sum + r.totalBonusAmount, 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  Across all saved runs
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Total Disbursed Records
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {savedRuns.reduce((sum, r) => sum + r.totalEmployees, 0)}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  Employee vouchers archived
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Saved Runs Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-indigo-600" />
                  Saved Bonus Runs & History
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Click "Load & View Slips" to inspect employee calculations or reprint vouchers from any previously saved bonus run
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fetchRunsFromBackend(true)}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Refresh saved history from database"
                >
                  <RotateCw className="w-3.5 h-3.5 text-gray-500" />
                  Refresh
                </Button>
                <Button
                  onClick={() => setActiveTab('CALCULATE')}
                  size="sm"
                  className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs flex items-center gap-1.5 font-medium shadow-xs cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Calculate New Bonus
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-gray-200 dark:border-slate-800">
              <Table className="w-full min-w-[980px] border-collapse">
                <TableHeader className="bg-gray-50/90 dark:bg-slate-800/90 text-[11px] font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                  <TableRow className="border-b border-gray-200 dark:border-slate-800">
                    <TableHead className="w-12 text-center px-3 py-3 border-r border-gray-200 dark:border-slate-700">#</TableHead>
                    <TableHead className="min-w-[180px] text-left px-4 py-3 border-r border-gray-200 dark:border-slate-700">Bonus Name</TableHead>
                    <TableHead className="min-w-[170px] text-left px-4 py-3 border-r border-gray-200 dark:border-slate-700">Period</TableHead>
                    <TableHead className="min-w-[190px] text-left px-4 py-3 border-r border-gray-200 dark:border-slate-700">Criteria Used</TableHead>
                    <TableHead className="w-28 text-center px-3 py-3 border-r border-gray-200 dark:border-slate-700">Employees</TableHead>
                    <TableHead className="w-36 text-right px-4 py-3 border-r border-gray-200 dark:border-slate-700">Total Bonus</TableHead>
                    <TableHead className="min-w-[160px] text-center px-3 py-3 border-r border-gray-200 dark:border-slate-700">Saved Date</TableHead>
                    <TableHead className="w-36 text-center px-3 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="text-sm divide-y divide-gray-100 dark:divide-slate-800">
                  {savedRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-400 dark:text-slate-500">
                        No saved bonus runs found. Click "Save This Bonus Run" on the calculator screen to archive your first run.
                      </TableCell>
                    </TableRow>
                  ) : (
                    savedRuns.map((run, idx) => (
                      <TableRow key={run.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800">
                        <TableCell className="text-center font-mono text-xs text-gray-400 px-3 py-3 border-r border-gray-200 dark:border-slate-800">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-left px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                          <div className="font-semibold text-gray-900 dark:text-white uppercase">
                            {run.bonusName}
                          </div>
                        </TableCell>
                        <TableCell className="text-left font-mono text-xs text-gray-600 dark:text-slate-400 px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                          {run.fromDate} → {run.toDate}
                        </TableCell>
                        <TableCell className="text-left px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                          {run.rateMode === 'TIERED' ? (
                            <div className="text-xs">
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                {WORKDAY_CRITERIA_LABELS[run.primaryCriteria || 'FULL_DAY_ONLY']} ({run.tier1Percentage}%)
                              </span>
                              <div className="text-gray-500 dark:text-slate-400 font-normal">
                                + {WORKDAY_CRITERIA_LABELS[run.secondaryCriteria || 'GREATER_EQUAL_HALF_DAY']} ({run.tier2Percentage}%)
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs font-mono border-gray-200 dark:border-slate-700">
                              {WORKDAY_CRITERIA_LABELS[run.workdayCriteria]} ({run.bonusPercentage}%)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold font-mono text-gray-900 dark:text-white px-3 py-3 border-r border-gray-200 dark:border-slate-800">
                          {run.totalEmployees}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                          ₹{run.totalBonusAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono text-gray-600 dark:text-slate-300 whitespace-nowrap px-3 py-3 border-r border-gray-200 dark:border-slate-800">
                          {formatSavedDateTime(run.createdAt)}
                        </TableCell>
                        <TableCell className="text-center px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLoadSavedRun(run)}
                              className="h-8 px-2.5 text-xs border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 font-medium flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Load & View Slips
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRunToDelete(run)}
                              className="h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="Delete from saved history"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Live Calculator & Slips Content */
        <div className="space-y-6">
          {/* KPI Summary Cards - Universal Attendance Clean Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Total Bonus Payout */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Total Bonus Payout
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
                  ₹{metrics.totalBonus.toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  Pool: ₹{metrics.totalBaseSalary.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 2: Average Bonus */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Average Bonus
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
                  ₹{metrics.avgBonus.toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  {rateMode === 'TIERED'
                    ? `Dual Rates: ${tier1Percentage}% & ${tier2Percentage}%`
                    : `Flat Rate: ${bonusPercentage}%`}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 3: Regular Salary Base */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Regular Salary Base
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
                  ₹{metrics.totalBaseSalary.toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  Total regular shift salary evaluated
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Configuration & Criteria Control Panel Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Bonus Calculation Controls & Criteria
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Formula: Total Days Worked × Per Day Regular Salary × Bonus % (Evaluated against each employee's regular shift)
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs font-medium"
              >
                Live Recalculation
              </Badge>
            </div>

            <div className="p-5">
              {rateMode === 'FLAT' ? (
                /* SINGLE ROW: All 4 controls in the exact same row with matching heights and widths */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                  {/* Control 1: Bonus Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center h-6">
                      <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                        <span>Bonus Name</span>
                      </label>
                    </div>
                    <Input
                      type="text"
                      value={bonusName}
                      onChange={(e) => setBonusName(e.target.value)}
                      onBlur={() => handleCommitBonusName()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCommitBonusName();
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="e.g. ANNUAL BONUS"
                      className="w-full bg-white dark:bg-slate-800 font-semibold uppercase text-gray-900 dark:text-white h-9 text-xs border-gray-300 dark:border-slate-700"
                    />
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate h-4 leading-4">
                      {bonusName.trim()
                        ? `Appears on slip: "RECEIVED FOR ${bonusName.toUpperCase()}"`
                        : 'Type name and press Enter or click outside to calculate'}
                    </p>
                  </div>

                  {/* Control 2: Period */}
                  <div className="space-y-1.5">
                    <div className="flex items-center h-6">
                      <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Bonus Period (From – To)</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* From Date Popover */}
                      <Popover open={isFromCalendarOpen} onOpenChange={setIsFromCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-9 px-2.5 flex items-center justify-between text-xs font-normal bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-xs cursor-pointer"
                          >
                            <span className="font-medium text-xs text-gray-900 dark:text-white">
                              {formatDisplayDate(fromDate)}
                            </span>
                            <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-slate-400 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800 z-50 shadow-xl rounded-xl" align="start">
                          <MultiViewCalendar
                            selected={parseIsoDate(fromDate)}
                            onSelect={(d) => {
                              setIsFromCalendarOpen(false);
                              onFromDateChange(formatIsoDate(d));
                            }}
                            fromYear={2020}
                            toYear={2035}
                          />
                        </PopoverContent>
                      </Popover>

                      {/* To Date Popover */}
                      <Popover open={isToCalendarOpen} onOpenChange={setIsToCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-9 px-2.5 flex items-center justify-between text-xs font-normal bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-xs cursor-pointer"
                          >
                            <span className="font-medium text-xs text-gray-900 dark:text-white">
                              {formatDisplayDate(toDate)}
                            </span>
                            <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-slate-400 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800 z-50 shadow-xl rounded-xl" align="start">
                          <MultiViewCalendar
                            selected={parseIsoDate(toDate)}
                            onSelect={(d) => {
                              setIsToCalendarOpen(false);
                              onToDateChange(formatIsoDate(d));
                            }}
                            fromYear={2020}
                            toYear={2035}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate h-4 leading-4">
                      Period evaluated for attendance days
                    </p>
                  </div>

                  {/* Control 3: Working Day Criteria */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between h-6">
                      <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1 uppercase tracking-wide">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Day Criteria</span>
                        <button
                          type="button"
                          onClick={() => setCriteriaModalOpen(true)}
                          className="inline-flex items-center justify-center p-0.5 rounded-full text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Click to understand each criteria option"
                        >
                          <HelpCircle className="w-3.5 h-3.5 cursor-pointer text-emerald-600 dark:text-emerald-400" />
                        </button>
                      </label>
                      <button
                        type="button"
                        onClick={() => setCriteriaModalOpen(true)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                      >
                        Explain options
                      </button>
                    </div>
                    <Select
                      value={workdayCriteria}
                      onValueChange={(val: WorkdayCriteria) => onWorkdayCriteriaChange(val)}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-slate-800 font-medium border-gray-300 dark:border-slate-700 h-9 text-xs">
                        <SelectValue placeholder="Select day criteria" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                        <SelectItem value="FULL_DAY_ONLY">Full Day Only</SelectItem>
                        <SelectItem value="GREATER_EQUAL_HALF_DAY">Greater or Equal to Half Day</SelectItem>
                        <SelectItem value="PROPORTIONAL_HOURS">Proportional Hours</SelectItem>
                        <SelectItem value="ANY_ATTENDANCE">Any Attendance</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate h-4 leading-4">
                      Rules for eligible working days
                    </p>
                  </div>

                  {/* Control 4: Bonus Rate & Mode */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between h-6">
                      <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1 uppercase tracking-wide">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bonus Rate %</span>
                      </label>
                      {/* Rate Mode Toggle */}
                      <div className="inline-flex rounded-lg border border-gray-200 dark:border-slate-700 p-0.5 bg-gray-100 dark:bg-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => onRateModeChange('FLAT')}
                          className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                            rateMode === 'FLAT'
                              ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                              : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Single
                        </button>
                        <button
                          type="button"
                          onClick={() => onRateModeChange('TIERED')}
                          className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                            rateMode === 'TIERED'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Dual
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={rateInputDraft}
                        onChange={(e) => setRateInputDraft(e.target.value)}
                        onBlur={commitBonusRate}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            commitBonusRate();
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-800 font-bold text-gray-900 dark:text-white h-9 pr-7 text-xs border-gray-300 dark:border-slate-700"
                        placeholder="e.g. 15"
                      />
                      <span className="absolute right-2.5 top-2 text-xs text-gray-400 font-bold">%</span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate h-4 leading-4">
                      Bonus percentage applied to regular salary
                    </p>
                  </div>
                </div>
              ) : (
                /* DUAL CRITERIA MODE */
                <div className="space-y-4">
                  {/* Top Row: Name, Period & Mode Toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    {/* Control 1: Bonus Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                        Bonus Name
                      </label>
                      <Input
                        type="text"
                        value={bonusName}
                        onChange={(e) => setBonusName(e.target.value)}
                        onBlur={() => handleCommitBonusName()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCommitBonusName();
                            e.currentTarget.blur();
                          }
                        }}
                        placeholder="e.g. ANNUAL BONUS"
                        className="bg-white dark:bg-slate-800 font-semibold uppercase text-gray-900 dark:text-white h-9 text-xs border-gray-300 dark:border-slate-700"
                      />
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate h-4 leading-4">
                        {bonusName.trim()
                          ? `Appears on slip: "RECEIVED FOR ${bonusName.toUpperCase()}"`
                          : 'Type name and press Enter or click outside to calculate'}
                      </p>
                    </div>

                    {/* Control 2: Period */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        Bonus Period (From – To)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Dual Mode From Date Popover */}
                        <Popover open={isDualFromCalendarOpen} onOpenChange={setIsDualFromCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-9 px-2.5 flex items-center justify-between text-xs font-normal bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-xs cursor-pointer"
                            >
                              <span className="font-medium text-xs text-gray-900 dark:text-white">
                                {formatDisplayDate(fromDate)}
                              </span>
                              <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-slate-400 shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800 z-50 shadow-xl rounded-xl" align="start">
                            <MultiViewCalendar
                              selected={parseIsoDate(fromDate)}
                              onSelect={(d) => {
                                setIsDualFromCalendarOpen(false);
                                onFromDateChange(formatIsoDate(d));
                              }}
                              fromYear={2020}
                              toYear={2035}
                            />
                          </PopoverContent>
                        </Popover>

                        {/* Dual Mode To Date Popover */}
                        <Popover open={isDualToCalendarOpen} onOpenChange={setIsDualToCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-9 px-2.5 flex items-center justify-between text-xs font-normal bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-xs cursor-pointer"
                            >
                              <span className="font-medium text-xs text-gray-900 dark:text-white">
                                {formatDisplayDate(toDate)}
                              </span>
                              <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-slate-400 shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800 z-50 shadow-xl rounded-xl" align="start">
                            <MultiViewCalendar
                              selected={parseIsoDate(toDate)}
                              onSelect={(d) => {
                                setIsDualToCalendarOpen(false);
                                onToDateChange(formatIsoDate(d));
                              }}
                              fromYear={2020}
                              toYear={2035}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        Bonus Rate Mode
                      </label>
                      <div className="inline-flex w-full rounded-lg border border-gray-200 dark:border-slate-700 p-0.5 bg-gray-100 dark:bg-slate-800 text-xs h-9 items-center">
                        <button
                          type="button"
                          onClick={() => onRateModeChange('FLAT')}
                          className={`flex-1 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            rateMode === 'FLAT'
                              ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                              : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Single Criteria
                        </button>
                        <button
                          type="button"
                          onClick={() => onRateModeChange('TIERED')}
                          className={`flex-1 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            rateMode === 'TIERED'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Dual Criteria (2 Bonuses)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dual Criteria Row */}
                  <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                          Working Day Consideration Criteria (Choose Any 2 Criteria Below)
                        </span>
                        <button
                          type="button"
                          onClick={() => setCriteriaModalOpen(true)}
                          className="inline-flex items-center justify-center p-0.5 rounded-full text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Click to understand each criteria option"
                        >
                          <HelpCircle className="w-4 h-4 cursor-pointer text-emerald-600 dark:text-emerald-400" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCriteriaModalOpen(true)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3 h-3" />
                        <span>Explain each option</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Criteria Dropdown 1 */}
                      <div className="p-3.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                              1
                            </span>
                            First Bonus Criteria
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 text-[11px] font-semibold"
                          >
                            Rate: {tier1Percentage}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-8 space-y-1">
                            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                              Select Any Criteria #1
                            </label>
                            <Select
                              value={primaryCriteria}
                              onValueChange={(val: WorkdayCriteria) => onPrimaryCriteriaChange(val)}
                            >
                              <SelectTrigger className="w-full bg-white dark:bg-slate-800 font-medium border-gray-300 dark:border-slate-700 h-9 text-xs">
                                <SelectValue placeholder="Select first criteria" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                                <SelectItem value="FULL_DAY_ONLY">Full Day Only</SelectItem>
                                <SelectItem value="GREATER_EQUAL_HALF_DAY">Greater or Equal to Half Day</SelectItem>
                                <SelectItem value="PROPORTIONAL_HOURS">Proportional Hours</SelectItem>
                                <SelectItem value="ANY_ATTENDANCE">Any Attendance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="sm:col-span-4 space-y-1">
                            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                              Bonus Rate %
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={tier1InputDraft}
                                onChange={(e) => setTier1InputDraft(e.target.value)}
                                onBlur={commitTier1Rate}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    commitTier1Rate();
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="bg-white dark:bg-slate-800 font-bold text-gray-900 dark:text-white h-9 pr-6 text-xs border-gray-300 dark:border-slate-700"
                              />
                              <span className="absolute right-2 top-2 text-xs text-gray-400 font-bold">%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Criteria Dropdown 2 */}
                      <div className="p-3.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs flex items-center justify-center font-bold">
                              2
                            </span>
                            Second Bonus Criteria
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-semibold"
                          >
                            Rate: {tier2Percentage}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-8 space-y-1">
                            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                              Select Any Criteria #2
                            </label>
                            <Select
                              value={secondaryCriteria}
                              onValueChange={(val: WorkdayCriteria) => onSecondaryCriteriaChange(val)}
                            >
                              <SelectTrigger className="w-full bg-white dark:bg-slate-800 font-medium border-gray-300 dark:border-slate-700 h-9 text-xs">
                                <SelectValue placeholder="Select second criteria" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                                <SelectItem value="FULL_DAY_ONLY">Full Day Only</SelectItem>
                                <SelectItem value="GREATER_EQUAL_HALF_DAY">Greater or Equal to Half Day</SelectItem>
                                <SelectItem value="PROPORTIONAL_HOURS">Proportional Hours</SelectItem>
                                <SelectItem value="ANY_ATTENDANCE">Any Attendance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="sm:col-span-4 space-y-1">
                            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                              Bonus Rate %
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={tier2InputDraft}
                                onChange={(e) => setTier2InputDraft(e.target.value)}
                                onBlur={commitTier2Rate}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    commitTier2Rate();
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="bg-white dark:bg-slate-800 font-bold text-gray-900 dark:text-white h-9 pr-6 text-xs border-gray-300 dark:border-slate-700"
                              />
                              <span className="absolute right-2 top-2 text-xs text-gray-400 font-bold">%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employee Records Table Card - Matches Daily Salary & Payroll Screen */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  Employee Bonus Breakdown
                  <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">
                    ({filteredEmployees.length} of {employees.length})
                  </span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Click "Print Slip" on any employee row to preview and print their individual voucher
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400 dark:text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Search name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-xs border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                {/* Department Filter */}
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="h-9 w-36 text-xs border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-gray-200 dark:border-slate-800">
              <Table className="w-full min-w-[1020px] border-collapse">
                <TableHeader className="bg-gray-50/90 dark:bg-slate-800/90 text-[11px] font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                  <TableRow className="border-b border-gray-200 dark:border-slate-800">
                    <TableHead className="w-12 text-center px-3 py-3 border-r border-gray-200 dark:border-slate-700">#</TableHead>
                    <TableHead className="min-w-[190px] text-left px-4 py-3 border-r border-gray-200 dark:border-slate-700">Employee</TableHead>
                    <TableHead className="min-w-[130px] text-left px-4 py-3 border-r border-gray-200 dark:border-slate-700">Department</TableHead>
                    <TableHead className="w-24 text-center px-3 py-3 border-r border-gray-200 dark:border-slate-700">Shift</TableHead>
                    <TableHead className="w-28 text-center px-3 py-3 border-r border-gray-200 dark:border-slate-700">Total Days</TableHead>
                    <TableHead className="w-32 text-right px-4 py-3 border-r border-gray-200 dark:border-slate-700">Per Day Rate</TableHead>
                    <TableHead className="w-36 text-right px-4 py-3 border-r border-gray-200 dark:border-slate-700">Total Salary</TableHead>
                    <TableHead className="w-28 text-center px-3 py-3 border-r border-gray-200 dark:border-slate-700">Bonus %</TableHead>
                    <TableHead className="w-36 text-right px-4 py-3 border-r border-gray-200 dark:border-slate-700 font-bold text-gray-900 dark:text-white">
                      Bonus Amount
                    </TableHead>
                    <TableHead className="w-32 text-center px-3 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="text-sm divide-y divide-gray-100 dark:divide-slate-800">
                  {isLoadingBonus ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                            {loadingTitle}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {loadingDesc}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16">
                        {!bonusName.trim() ? (
                          <div className="flex flex-col items-center justify-center gap-2.5">
                            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                              <Gift className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                              Enter Bonus Name to Calculate
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md">
                              Type a Bonus Name in the field above and press <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-gray-700 dark:text-slate-300">Enter</kbd> or click outside to calculate employee bonuses.
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500">
                            No employee records found matching your filters.
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp, idx) => (
                      <TableRow
                        key={emp.id}
                        className="hover:bg-gray-50/60 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800"
                      >
                        <TableCell className="text-center font-mono text-xs text-gray-400 px-3 py-3 border-r border-gray-200 dark:border-slate-800">
                          {idx + 1}
                        </TableCell>

                        {/* Employee Info */}
                        <TableCell className="text-left px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center font-semibold text-xs text-gray-700 dark:text-slate-300 shrink-0">
                              {emp.employeeName.charAt(0)}
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-gray-900 dark:text-white block">
                                {emp.employeeName}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-slate-400 block font-mono">
                                {emp.employeeId}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Department */}
                        <TableCell className="text-left px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                          <span className="text-xs text-gray-600 dark:text-slate-300 font-medium">
                            {emp.department}
                          </span>
                        </TableCell>

                        {/* Assigned Shift Hours */}
                        <TableCell className="text-center px-3 py-3 border-r border-gray-200 dark:border-slate-800">
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-mono text-xs px-2 py-0.5 inline-flex justify-center"
                          >
                            {emp.assignedShiftHours}h
                          </Badge>
                        </TableCell>

                        {/* Total Days */}
                        <TableCell className="text-center font-semibold font-mono text-gray-900 dark:text-white px-3 py-3 border-r border-gray-200 dark:border-slate-800">
                          <div>{formatDays(emp.totalDays)}</div>
                          {rateMode === 'TIERED' && emp.tier1DaysCount !== undefined && (
                            <div className="text-[10px] font-normal text-gray-500 dark:text-slate-400">
                              {formatDays(emp.tier1DaysCount)}d + {formatDays(emp.tier2DaysCount)}d
                            </div>
                          )}
                        </TableCell>

                        {/* Per Day Salary */}
                        <TableCell className="text-right font-mono text-gray-700 dark:text-slate-300 px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                          ₹{emp.perDaySalary.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </TableCell>

                        {/* Regular Salary Total */}
                        <TableCell className="text-right font-mono font-medium text-gray-900 dark:text-white px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                          ₹{emp.regularSalary.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </TableCell>

                        {/* Bonus % */}
                        <TableCell className="text-center font-semibold text-amber-600 dark:text-amber-400 px-3 py-3 border-r border-gray-200 dark:border-slate-800">
                          {rateMode === 'TIERED' ? (
                            <div className="text-xs font-mono">
                              <span className="text-gray-900 dark:text-white font-bold" title={emp.tier1CriteriaName || 'Tier 1'}>
                                {emp.tier1BonusPercentage}%
                              </span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="text-amber-600 dark:text-amber-400 font-bold" title={emp.tier2CriteriaName || 'Tier 2'}>
                                {emp.tier2BonusPercentage}%
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono">{emp.bonusPercentage}%</span>
                          )}
                        </TableCell>

                        {/* Calculated Bonus Amount */}
                        <TableCell className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                          ₹{emp.bonusAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </TableCell>

                        {/* Actions - Print Slip for this employee */}
                        <TableCell className="text-center px-3 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenSlip(emp)}
                            className="h-8 px-2.5 text-xs border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 font-medium flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap mx-auto"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Print Slip
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {filteredEmployees.length > 0 && !isLoadingBonus && (
                  <TableFooter className="bg-gray-50/90 dark:bg-slate-800/90 font-semibold text-xs border-t-2 border-gray-300 dark:border-slate-700">
                    <TableRow>
                      <TableCell colSpan={6} className="text-right uppercase tracking-wider text-gray-600 dark:text-slate-300 px-4 py-3 border-r border-gray-200 dark:border-slate-800 font-medium">
                        Total ({filteredEmployees.length} Employees)
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-gray-900 dark:text-white px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                        ₹{filteredEmployees.reduce((sum, e) => sum + e.regularSalary, 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center font-mono text-gray-400 dark:text-slate-500 px-3 py-3 border-r border-gray-200 dark:border-slate-800">
                        —
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 px-4 py-3 border-r border-gray-200 dark:border-slate-800">
                        ₹{filteredEmployees.reduce((sum, e) => sum + e.bonusAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        —
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Voucher Slip Modal (Matches physical voucher format) */}
      <BonusSlipModal
        isOpen={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        employee={selectedEmployeeForSlip}
        bonusName={bonusName}
      />

      {/* Criteria Explanation Guide Modal - Full Window Experience */}
      <Dialog open={criteriaModalOpen} onOpenChange={setCriteriaModalOpen}>
        <DialogContent className="!w-[92vw] !max-w-[92vw] sm:!max-w-[92vw] sm:!w-[92vw] max-h-[92vh] overflow-y-auto p-6 sm:p-8 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
          <DialogHeader className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Working Day Consideration Criteria Guide
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Understand how different attendance durations (full shift, half day, short hours) count toward Total Days for bonus calculation
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* 2-Column Responsive Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Note on Individual Assigned Shift Duration (Spans Full Width) */}
            <div className="md:col-span-2 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Individual Shift Awareness:</span> Thresholds are automatically evaluated against each employee's assigned regular shift duration (e.g. 8h, 9h, 10h, or 12h). A "half day" means 50% of that specific employee's shift (e.g. 4h for an 8h shift, 6h for a 12h shift).
              </div>
            </div>

            {/* Option 1: Full Shift Only */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Full Shift Only (100% of regular shift hours)
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-gray-200 dark:border-slate-700">
                    Strict Policy
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                  Only days where the employee completed their <strong>entire 100% regular shift</strong> count toward bonus. Any half day or short hours are ignored (0 days).
                </p>
              </div>
              <div className="mt-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-mono">
                <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Ramesh Example:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  Only 125 full shifts = 125 Days → ₹1,37,500 Base
                </span>
              </div>
            </div>

            {/* Option 2: Greater or Equal to Half Day */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Greater or Equal to Half Day (≥ 50% = 1 Day, &lt; 50% = 0)
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-gray-200 dark:border-slate-700">
                    Threshold Policy
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                  If an employee worked <strong>half or more (≥ 50%) of their assigned regular shift</strong>, that entire day counts as <strong>1 full working day</strong>. Days with less than 50% shift hours are not counted (0 days).
                </p>
              </div>
              <div className="mt-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-mono">
                <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Ramesh Example:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  125 full days + 14 half days (≥50%) = 139 Days → ₹1,52,900 Base
                </span>
              </div>
            </div>

            {/* Option 3: Proportional to Employee's Shift Hours */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Proportional to Employee's Shift Hours
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-gray-200 dark:border-slate-700">
                    Exact Hours Worked
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                  Calculates exact fractional days: <strong>Total Regular Hours Worked ÷ Employee's Assigned Regular Shift Hours</strong>. For example, 2 hours on an 8h shift = exactly 0.25 day; 4 hours = exactly 0.5 day.
                </p>
              </div>
              <div className="mt-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-mono">
                <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Ramesh Example (1,064 regular hours ÷ 8h shift):</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  1,064 ÷ 8 = 133.0 Days → ₹1,46,300 Base
                </span>
              </div>
            </div>

            {/* Option 4: Any Attendance (Spans Full Width) */}
            <div className="md:col-span-2 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Any Attendance (Any Punched Day = 1 Day)
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-gray-200 dark:border-slate-700">
                    Headcount / Any Punch
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2 leading-relaxed">
                  If the employee has any attendance or punch record on that date (even 1 or 2 hours), that day is credited as <strong>1 full working day</strong> regardless of duration.
                </p>
              </div>
              <div className="mt-3 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-mono">
                <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Ramesh Example (125 full + 14 half + 4 short days):</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  125 + 14 + 4 = 143 Days → ₹1,57,300 Base
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex justify-end">
            <Button
              onClick={() => setCriteriaModalOpen(false)}
              className="bg-gray-900 hover:bg-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs px-5 h-9 font-medium"
            >
              Close Guide
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User-friendly Delete Confirmation Modal (replaces native browser confirm) */}
      <Dialog open={!!runToDelete} onOpenChange={(open) => { if (!open) setRunToDelete(null); }}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Delete Saved Bonus Run?
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to permanently delete this archived bonus calculation? All recorded vouchers for this run will be removed from the database.
                </DialogDescription>
              </div>
            </div>

            {/* Run summary badge card */}
            {runToDelete && (
              <div className="mt-4 p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/70 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white uppercase">
                    {runToDelete.bonusName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-slate-300 font-mono text-[11px]">
                  <span>Period: {runToDelete.fromDate} → {runToDelete.toDate}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{runToDelete.totalBonusAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-[11px]">
                  <span>Employees: {runToDelete.totalEmployees}</span>
                  <span>Saved: {formatSavedDateTime(runToDelete.createdAt)}</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRunToDelete(null)}
                className="h-9 px-4 text-xs font-medium border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDeleteRun}
                className="h-9 px-4 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Run
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User-friendly Prompt Bonus Name Modal (replaces native browser alert) */}
      <Dialog open={isPromptNameDialogOpen} onOpenChange={setIsPromptNameDialogOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Name Your Bonus Run
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  Please enter a name for this calculation run (e.g. ANNUAL BONUS 2026, DIWALI BONUS) to calculate attendance and archive to saved history.
                </DialogDescription>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                Bonus Run Name
              </label>
              <Input
                type="text"
                autoFocus
                value={promptNameInput}
                onChange={(e) => {
                  setPromptNameInput(e.target.value);
                  if (promptNameError) setPromptNameError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePromptSaveSubmit();
                  }
                }}
                placeholder="e.g. ANNUAL BONUS 2026"
                className="w-full bg-white dark:bg-slate-800 font-semibold uppercase text-gray-900 dark:text-white h-10 text-sm border-gray-300 dark:border-slate-700"
              />
              {promptNameError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {promptNameError}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPromptNameDialogOpen(false)}
                className="h-9 px-4 text-xs font-medium border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handlePromptSaveSubmit}
                className="h-9 px-4 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Calculate & Save Run
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
