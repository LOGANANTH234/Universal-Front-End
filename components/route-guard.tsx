"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { getRequiredModule } from "@/lib/routes-config"
import { Loader2 } from "lucide-react"
import { ModuleTrialBanner } from "@/components/module-trial-banner"

interface RouteGuardProps {
  children?: React.ReactNode
  requiredModule?: string
}

export function RouteGuard({ children, requiredModule }: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { auth, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) {
      return
    }

    // If not authenticated, redirect to login
    if (!auth) {
      router.push("/login")
      return
    }

    const moduleToCheck = requiredModule || getRequiredModule(pathname)

    // If no module is required, allow access
    if (!moduleToCheck) {
      setIsChecking(false)
      return
    }

    // Trial/preview modules: always grant access regardless of assigned modules
    const TRIAL_PREVIEW_MODULES = ["BONUS_MANAGEMENT", "SALARY"]
    if (moduleToCheck && TRIAL_PREVIEW_MODULES.includes(moduleToCheck)) {
      setIsChecking(false)
      return
    }

    // Check if user has the required module
    const hasModule = auth.modules && auth.modules.some((m) => m.moduleCode === moduleToCheck)

    if (!hasModule) {
      router.push("/unauthorized")
      return
    }

    // Access granted
    setIsChecking(false)
  }, [auth, isLoading, requiredModule, pathname, router])

  // Show loading state while checking
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const activeModule = requiredModule || getRequiredModule(pathname)

  // Some modules manage their own per-tab trial banners; skip the page-level banner for them
  const SELF_MANAGED_TRIAL_BANNERS = ["SALARY"]
  if (activeModule && SELF_MANAGED_TRIAL_BANNERS.includes(activeModule)) {
    return <>{children}</>
  }

  // Render children if access is granted with trial banner on top
  return (
    <ModuleTrialBanner moduleCode={activeModule}>
      {children}
    </ModuleTrialBanner>
  )
}

