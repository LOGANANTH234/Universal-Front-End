'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { BonusEmployeeItem } from '@/lib/bonus-types';

interface BonusSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: BonusEmployeeItem | null;
  bonusName: string;
}

const formatDays = (n: number | null | undefined): string => {
  if (n == null || isNaN(Number(n))) return '0';
  const val = Math.round(Number(n) * 100) / 100;
  return Number.isInteger(val) ? val.toString() : val.toFixed(2);
};

export function BonusSlipModal({
  isOpen,
  onClose,
  employee,
  bonusName,
}: BonusSlipModalProps) {
  if (!employee) return null;

  const displayName = `${employee.employeeName.toUpperCase()} - ${employee.department.toUpperCase()}`;
  const effectiveBonusName = bonusName ? bonusName.toUpperCase().trim() : 'ANNUAL BONUS';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-xl p-0 overflow-hidden bg-white text-slate-900 border shadow-2xl">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <DialogTitle className="text-lg font-semibold text-white">
              Employee Bonus Voucher Slip
            </DialogTitle>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 sm:p-10 bg-white flex flex-col items-center justify-center">
          <div
            id="printable-bonus-voucher"
            className="w-full max-w-lg border-2 border-slate-900 p-6 bg-white shadow-sm font-sans"
          >
            {/* Voucher Header Table matching the physical sample */}
            <div className="border-2 border-slate-900">
              {/* Yellow Banner Header */}
              <div className="bg-[#fef08a] border-b-2 border-slate-900 px-4 py-2.5 text-center">
                <h2 className="text-lg font-bold tracking-wide text-slate-950 uppercase font-mono">
                  {displayName}
                </h2>
              </div>

              {/* Data Rows */}
              <div className="divide-y-2 divide-slate-900 text-sm font-semibold text-slate-900 font-mono">
                {/* Row 1: Total Days */}
                <div className="grid grid-cols-12 divide-x-2 divide-slate-900">
                  <div className="col-span-5 px-3 py-2 uppercase bg-slate-50">
                    TOTAL DAYS
                  </div>
                  <div className="col-span-7 px-3 py-2 text-right font-bold">
                    {employee.rateMode === 'TIERED' && employee.fullDaysCount !== undefined
                      ? `${formatDays(employee.totalDays)} (${formatDays(employee.fullDaysCount)} Full + ${formatDays(employee.halfDaysCount)} Half)`
                      : formatDays(employee.totalDays)}
                  </div>
                </div>

                {/* Row 2: Per Day Salary + Calculated Regular Amount */}
                <div className="grid grid-cols-12 divide-x-2 divide-slate-900">
                  <div className="col-span-5 px-3 py-2 uppercase bg-slate-50">
                    PERDAY SALARY
                  </div>
                  <div className="col-span-3 px-3 py-2 text-center">
                    {employee.perDaySalary.toLocaleString('en-IN')}
                  </div>
                  <div className="col-span-4 px-3 py-2 text-right font-bold">
                    {employee.regularSalary.toLocaleString('en-IN')}
                  </div>
                </div>

                {employee.rateMode === 'TIERED' ? (
                  <>
                    {/* Row 3: Tier 1 Criteria */}
                    <div className="grid grid-cols-12 divide-x-2 divide-slate-900 bg-emerald-50/30">
                      <div className="col-span-5 px-3 py-2 uppercase font-medium text-xs truncate" title={employee.tier1CriteriaName || 'Tier 1'}>
                        {(employee.tier1CriteriaName || 'TIER 1').toUpperCase()} ({formatDays(employee.tier1DaysCount ?? employee.fullDaysCount ?? employee.totalDays)}d)
                      </div>
                      <div className="col-span-3 px-3 py-2 text-center font-bold text-emerald-800">
                        {employee.tier1BonusPercentage ?? employee.fullDayBonusPercentage ?? 15}%
                      </div>
                      <div className="col-span-4 px-3 py-2 text-right font-bold text-slate-900">
                        {(employee.tier1BonusAmount ?? employee.fullDaysBonusAmount ?? 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Row 4: Tier 2 Criteria */}
                    <div className="grid grid-cols-12 divide-x-2 divide-slate-900 bg-emerald-50/30">
                      <div className="col-span-5 px-3 py-2 uppercase font-medium text-xs truncate" title={employee.tier2CriteriaName || 'Tier 2'}>
                        {(employee.tier2CriteriaName || 'TIER 2').toUpperCase()} ({formatDays(employee.tier2DaysCount ?? employee.halfDaysCount ?? 0)}d)
                      </div>
                      <div className="col-span-3 px-3 py-2 text-center font-bold text-emerald-800">
                        {employee.tier2BonusPercentage ?? employee.halfDayBonusPercentage ?? 10}%
                      </div>
                      <div className="col-span-4 px-3 py-2 text-right font-bold text-slate-900">
                        {(employee.tier2BonusAmount ?? employee.halfDaysBonusAmount ?? 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Row 5: Total Bonus */}
                    <div className="grid grid-cols-12 divide-x-2 divide-slate-900 bg-emerald-100/70">
                      <div className="col-span-5 px-3 py-2 uppercase font-bold text-slate-950">
                        TOTAL BONUS
                      </div>
                      <div className="col-span-3 px-3 py-2 text-center font-bold text-xs text-emerald-900 uppercase">
                        TIERED
                      </div>
                      <div className="col-span-4 px-3 py-2 text-right font-black text-base text-slate-950">
                        {employee.bonusAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Row 3: Bonus % and Calculated Bonus Amount */
                  <div className="grid grid-cols-12 divide-x-2 divide-slate-900 bg-emerald-50/60">
                    <div className="col-span-5 px-3 py-2 uppercase font-bold text-slate-900">
                      BONUS
                    </div>
                    <div className="col-span-3 px-3 py-2 text-center font-bold text-emerald-800">
                      {employee.bonusPercentage}%
                    </div>
                    <div className="col-span-4 px-3 py-2 text-right font-black text-base text-slate-950">
                      {employee.bonusAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Declaration Text exactly matching the physical receipt */}
            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm font-bold tracking-wider text-slate-900 uppercase font-mono leading-relaxed">
                RECEIVED THE ABOVE MENTION AMOUNT FOR {effectiveBonusName}
              </p>
            </div>
          </div>
        </div>

        {/* Print Stylesheet embedded */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-bonus-voucher,
            #printable-bonus-voucher * {
              visibility: visible;
            }
            #printable-bonus-voucher {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 100%;
              max-width: 480px;
              box-shadow: none !important;
              border: 2px solid #000 !important;
              margin: 0 !important;
              padding: 24px !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
