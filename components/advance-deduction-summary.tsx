'use client';

import { Card } from '@/components/ui/card';
import { mockAdvanceDeductions, getMockAdvanceSummary, mockAdvances } from '@/lib/advance-mock-data';

export function AdvanceDeductionSummary() {
  const summary = getMockAdvanceSummary(mockAdvances);
  const currentMonth = new Date().toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const thisMonthDeductions = mockAdvanceDeductions.filter(
    (d) => d.month === currentMonth
  );

  return (
    <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Advance Deductions This Month
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{summary.deductedThisMonth.toLocaleString()}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {thisMonthDeductions.length} advance{thisMonthDeductions.length !== 1 ? 's' : ''} being
            deducted
          </p>
        </div>
        <div className="text-4xl opacity-20">🏦</div>
      </div>
    </Card>
  );
}
