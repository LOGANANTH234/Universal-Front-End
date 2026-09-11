"use client"

import { SettingsScreen } from "@/components/settings-screen"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function SettingsPage() {
  return (
    <RouteGuard requiredModule={MODULES.SETTINGS}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <SettingsScreen />
      </div>
    </RouteGuard>
  )
}
