"use client"

import { LeaveManagementScreen } from "@/components/leave-management-screen"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function LeaveManagementPage() {
  return (
    <RouteGuard requiredModule={MODULES.LEAVE_MANAGEMENT}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <LeaveManagementScreen />
      </div>
    </RouteGuard>
  )
}
