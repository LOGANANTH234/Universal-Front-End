'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Advance, AdvanceDeduction } from '@/lib/advance-types';

interface AdvanceHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: Advance | null;
  deductions: AdvanceDeduction[];
}

export function AdvanceHistoryModal({
  open,
  onOpenChange,
  advance,
  deductions,
}: AdvanceHistoryModalProps) {
  if (!advance) return null;

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Partial: 'bg-blue-100 text-blue-800',
    Cleared: 'bg-green-100 text-green-800',
  };

  const advanceDeductions = deductions.filter((d) =>
    d.advanceRef.includes(advance.date.substring(0, 10))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">
                {advance.employeeName} — Advance History
              </div>
              <div className="text-sm text-gray-600 font-normal mt-1">
                {advance.employeeCode} · Pending balance: ₹{advance.remaining.toLocaleString()}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Advances Table */}
          <div>
            <h3 className="font-semibold text-base mb-4">Advances</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Deducted
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Remaining
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {new Date(advance.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">₹{advance.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{advance.reason}</td>
                    <td className="px-4 py-3">₹{advance.deducted.toLocaleString()}</td>
                    <td className="px-4 py-3 text-orange-600 font-medium">
                      ₹{advance.remaining.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${
                          statusColors[advance.status as keyof typeof statusColors]
                        }`}
                      >
                        {advance.status}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Deduction History */}
          {advanceDeductions.length > 0 && (
            <div>
              <h3 className="font-semibold text-base mb-4">Deduction history</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        Month
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        Deducted
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        Advance ref.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {advanceDeductions.map((deduction, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{deduction.month}</td>
                        <td className="px-4 py-3">₹{deduction.deducted.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {deduction.advanceRef}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
