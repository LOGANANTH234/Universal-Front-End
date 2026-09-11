'use client'

import { WarningsScreen } from '@/components/warnings-screen'
import { RouteGuard } from '@/components/route-guard'
import { useHasModule, MODULES } from '@/lib/permission-utils'

export default function WarningsPage() {
  const hasModuleAccess = useHasModule(MODULES.WARNING)

  // Route guard - redirect if no module access
  if (!hasModuleAccess) {
    return <RouteGuard requiredModule={MODULES.WARNING} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Warnings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">View and manage employee warnings</p>
        </div>
        <WarningsScreen />
      </div>
    </div>
  )
}
