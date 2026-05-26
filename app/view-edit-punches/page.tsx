'use client'

import { useState } from 'react'
import { RouteGuard } from '@/components/route-guard'
import ViewEditPunchesScreen from '@/components/view-edit-punches-screen'
import EmployeePunchHistoryScreen from '@/components/employee-punch-history-screen'
import DailyAttendanceSummaryScreen from '@/components/daily-attendance-summary-screen'

export default function ViewEditPunchesPage() {
  const [activeTab, setActiveTab] = useState<'edit' | 'history' | 'summary'>('edit')

  return (
    <RouteGuard>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 px-6 pt-6">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'edit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            View & Edit Punches
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Employee Punch History
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Attendance Summary
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'edit' && <ViewEditPunchesScreen />}
          {activeTab === 'history' && <EmployeePunchHistoryScreen />}
          {activeTab === 'summary' && <DailyAttendanceSummaryScreen />}
        </div>
      </div>
    </RouteGuard>
  )
}
