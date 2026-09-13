'use client'

import { useState, useEffect } from 'react'
import { Gift } from 'lucide-react'
import { DailySalaryScreen } from '@/components/daily-salary-screen'
import { WeeklySalaryScreen } from '@/components/weekly-salary-screen'
import { MonthlyPayrollScreen } from '@/components/monthly-payroll-screen'
import { OvertimeDetailsScreen } from '@/components/overtime-details-screen'
import { DailySalaryRangeScreen } from '@/components/daily-salary-range-screen'
import { SalaryAnalyticsScreen } from '@/components/salary-analytics-screen'
import { RouteGuard } from '@/components/route-guard'
import { ModuleTrialBanner } from '@/components/module-trial-banner'
import { useHasModule, MODULES } from '@/lib/permission-utils'
import { fetchModuleTrial } from '@/lib/api/module-trials'

export default function SalaryPage() {
  const [activeTab, setActiveTab] = useState('daily')
  const [isAnalyticsTrial, setIsAnalyticsTrial] = useState(false)
  const [isSalaryTrial, setIsSalaryTrial] = useState(false)

  useEffect(() => {
    let isMounted = true
    fetchModuleTrial('SALARY_ANALYTICS')
      .then((data) => {
        if (isMounted && data && data.isTrialActive && !data.isExpired) {
          setIsAnalyticsTrial(true)
        }
      })
      .catch(() => {})
    fetchModuleTrial('SALARY')
      .then((data) => {
        if (isMounted && data && data.isTrialActive && !data.isExpired) {
          setIsSalaryTrial(true)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const tabs = [
    { id: 'daily', label: 'Daily Salary' },
    { id: 'weekly', label: 'Weekly Salary' },
    { id: 'monthly', label: 'Monthly Payroll' },
    { id: 'overtime', label: 'Overtime Details' },
    { id: 'daily-details', label: 'Daily Salary Details', isTrial: isSalaryTrial },
    { id: 'analytics', label: 'Salary Analytics', isTrial: isAnalyticsTrial },
  ]

  return (
    <RouteGuard requiredModule={MODULES.SALARY}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
          <div className="w-full">
            <div className="flex gap-0 px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all border-b-2 inline-flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.isTrial && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full inline-flex items-center gap-1 shadow-sm ${
                        activeTab === tab.id
                          ? 'bg-white/25 text-white border border-white/40'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                      }`}
                    >
                      <Gift className="w-2.5 h-2.5 shrink-0" />
                      new
                    </span>
                  )}
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
          {activeTab === 'daily-details' && (
            <ModuleTrialBanner moduleCode="SALARY" inlineLockout={false}>
              <DailySalaryRangeScreen />
            </ModuleTrialBanner>
          )}
          {activeTab === 'analytics' && (
            <ModuleTrialBanner moduleCode="SALARY" inlineLockout={true}>
              <SalaryAnalyticsScreen />
            </ModuleTrialBanner>
          )}
        </div>
      </div>
    </RouteGuard>
  )
}
