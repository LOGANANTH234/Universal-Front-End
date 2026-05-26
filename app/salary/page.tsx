'use client'

import { useState } from 'react'
import { DailySalaryScreen } from '@/components/daily-salary-screen'
import { WeeklySalaryScreen } from '@/components/weekly-salary-screen'
import { MonthlyPayrollScreen } from '@/components/monthly-payroll-screen'
import { OvertimeDetailsScreen } from '@/components/overtime-details-screen'
import { RouteGuard } from '@/components/route-guard'
import { useHasModule, MODULES } from '@/lib/permission-utils'

export default function SalaryPage() {
  const hasModuleAccess = useHasModule(MODULES.SALARY)
  const [activeTab, setActiveTab] = useState('daily')

  // Route guard - redirect if no module access
  if (!hasModuleAccess) {
    return <RouteGuard requiredModule={MODULES.SALARY} />
  }

  const tabs = [
    { id: 'daily', label: 'Daily Salary' },
    { id: 'weekly', label: 'Weekly Salary' },
    { id: 'monthly', label: 'Monthly Payroll' },
    { id: 'overtime', label: 'Overtime Details' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="w-full">
          <div className="flex gap-0 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'daily' && <DailySalaryScreen />}
        {activeTab === 'weekly' && <WeeklySalaryScreen />}
        {activeTab === 'monthly' && <MonthlyPayrollScreen />}
        {activeTab === 'overtime' && <OvertimeDetailsScreen />}
      </div>
    </div>
  )
}
