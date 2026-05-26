"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { getRequiredModule } from "@/lib/routes-config"
import { Loader2 } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
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

  // Render children if access is granted
  return <>{children}</>
}
