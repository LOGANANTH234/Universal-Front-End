'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { GiveAdvanceModal } from './give-advance-modal';
import { AdvanceHistoryModal } from './advance-history-modal';
import { Advance, AdvanceDeduction } from '@/lib/advance-types';
import { mockAdvances, mockAdvanceDeductions, getMockAdvanceSummary } from '@/lib/advance-mock-data';

export function AdvanceManagementScreen() {
  const [advances, setAdvances] = useState<Advance[]>(mockAdvances);
  const [deductions] = useState<AdvanceDeduction[]>(mockAdvanceDeductions);
  const [giveAdvanceOpen, setGiveAdvanceOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);

  const summary = getMockAdvanceSummary(advances);

  const handleGiveAdvance = (advanceData: Omit<Advance, 'id' | 'given' | 'deducted' | 'remaining' | 'status'>) => {
    const newAdvance: Advance = {
      id: `ADV-${String(advances.length + 1).padStart(3, '0')}`,
      ...advanceData,
      given: advanceData.amount,
      deducted: 0,
      remaining: advanceData.amount,
      status: 'Pending',
    };
    setAdvances([newAdvance, ...advances]);
  };

  const handleViewHistory = (advance: Advance) => {
    setSelectedAdvance(advance);
    setHistoryOpen(true);
  };

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Partial: 'bg-blue-100 text-blue-800',
    Cleared: 'bg-green-100 text-green-800',
  };

  const getProgressPercentage = (advance: Advance) => {
    return Math.round((advance.deducted / advance.amount) * 100);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>👔</span>
            Employee Advances
          </h1>
          <p className="text-gray-600 mt-1">Track and manage salary advances</p>
        </div>
        <Button onClick={() => setGiveAdvanceOpen(true)} size="lg">
          + Give Advance
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Total pending
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{summary.totalPending.toLocaleString()}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Employees with advance
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {summary.employeesWithAdvance}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Deducted this month
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{summary.deductedThisMonth.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Advances Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Given
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Deducted
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Balance
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Progress
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {advances.map((advance) => {
                const progressPercent = getProgressPercentage(advance);
                return (
                  <tr key={advance.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {advance.employeeName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {advance.employeeCode}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      ₹{advance.given.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      ₹{advance.deducted.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-orange-600 font-semibold">
                      ₹{advance.remaining.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`${
                          statusColors[advance.status as keyof typeof statusColors]
                        }`}
                      >
                        {advance.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewHistory(advance)}
                      >
                        History
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {advances.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No advances found</p>
          </div>
        )}
      </Card>

      {/* Modals */}
      <GiveAdvanceModal
        open={giveAdvanceOpen}
        onOpenChange={setGiveAdvanceOpen}
        onConfirm={handleGiveAdvance}
      />

      <AdvanceHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        advance={selectedAdvance}
        deductions={deductions}
      />
    </div>
  );
}
