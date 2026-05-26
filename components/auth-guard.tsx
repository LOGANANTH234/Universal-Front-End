"use client"

import type React from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

// Pages that never require authentication
const PUBLIC_PATHS = ["/", "/login", "/pricing"]
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { auth, isLoading } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()

  const isPublic    = PUBLIC_PATHS.includes(pathname)
  const isLoginPage = pathname === "/login"

  // Authenticated user on login → send to dashboard
  useEffect(() => {
    if (!isLoading && auth && isLoginPage) {
      router.replace("/live-attendance")
    }
  }, [auth, isLoading, isLoginPage, router])

  // Unauthenticated user on a protected page → send to login
  useEffect(() => {
    if (!isLoading && !auth && !isPublic) {
      router.replace("/")
    }
  }, [auth, isLoading, isPublic, router])

  // Show nothing while auth is initialising
  if (isLoading) return null

  // Public pages always render
  if (isPublic) return <>{children}</>

  // Protected pages only render when authenticated
  if (auth) return <>{children}</>

  // Redirect is in-flight
  return null
}
