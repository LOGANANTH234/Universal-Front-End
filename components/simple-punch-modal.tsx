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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full mx-4"
        style={{ maxHeight: '90vh', height: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: '#E5E7EB' }}
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Punch Records - {employeeName}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th
                  className="px-6 py-4 text-left text-base font-semibold text-gray-900"
                  style={{ width: '25%' }}
                >
                  Employee
                </th>
                <th
                  className="px-6 py-4 text-left text-base font-semibold text-gray-900"
                  style={{ width: '20%' }}
                >
                  Type
                </th>
                <th
                  className="px-6 py-4 text-left text-base font-semibold text-gray-900"
                  style={{ width: '25%' }}
                >
                  Date
                </th>
                <th
                  className="px-6 py-4 text-left text-base font-semibold text-gray-900"
                  style={{ width: '30%' }}
                >
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {punchDetails && punchDetails.length > 0 ? (
                punchDetails.map((punch) => (
                  <tr
                    key={punch.id}
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-5 text-base text-gray-900">
                      {punch.employeeName || '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          backgroundColor: punch.punchType === 'IN' ? '#D1FAE5' : '#FEE2E2',
                          color: punch.punchType === 'IN' ? '#059669' : '#DC2626',
                        }}
                      >
                        {punch.punchType}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-base text-gray-900">
                      {formatDate(punch.attendanceDate)}
                    </td>
                    <td className="px-6 py-5 text-base text-gray-900 font-mono">
                      {punch.punchTime}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-base text-gray-500">
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
