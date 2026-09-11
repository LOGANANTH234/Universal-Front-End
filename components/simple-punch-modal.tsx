'use client'

import { X } from 'lucide-react'
import type { PunchDetail } from '@/lib/attendance-types'

interface SimplePunchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeName: string
  punchDetails: PunchDetail[]
}

export default function SimplePunchModal({
  open,
  onOpenChange,
  employeeName,
  punchDetails,
}: SimplePunchModalProps) {
  if (!open) return null

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-850"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
            Punch Records - {employeeName}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                <th
                  className="px-6 py-3.5 text-left text-xs uppercase tracking-wide font-semibold text-gray-600 dark:text-slate-300"
                  style={{ width: '25%' }}
                >
                  Employee
                </th>
                <th
                  className="px-6 py-3.5 text-left text-xs uppercase tracking-wide font-semibold text-gray-600 dark:text-slate-300"
                  style={{ width: '20%' }}
                >
                  Type
                </th>
                <th
                  className="px-6 py-3.5 text-left text-xs uppercase tracking-wide font-semibold text-gray-600 dark:text-slate-300"
                  style={{ width: '25%' }}
                >
                  Date
                </th>
                <th
                  className="px-6 py-3.5 text-left text-xs uppercase tracking-wide font-semibold text-gray-600 dark:text-slate-300"
                  style={{ width: '30%' }}
                >
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {punchDetails && punchDetails.length > 0 ? (
                punchDetails.map((punch) => (
                  <tr
                    key={punch.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-200">
                      {punch.employeeName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${
                          punch.punchType === 'IN'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {punch.punchType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300 font-mono">
                      {formatDate(punch.attendanceDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-200 font-mono font-medium">
                      {punch.punchTime}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-slate-500">
                    No punch records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
