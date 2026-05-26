"use client"

import type React from "react"
import { AppNavigation } from "@/components/app-navigation"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { ProfileButton } from "@/components/profile-button"

// Pages that don't get the sidebar + topbar app shell
const NO_SHELL = ["/", "/login"]

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const showShell  = !NO_SHELL.includes(pathname)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const check = () => {
      const w = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width")
      setCollapsed(w === "4rem")
    }
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] })
    return () => obs.disconnect()
  }, [])

  return (
    <AuthGuard>
      <>
        {showShell && <AppNavigation />}

        {showShell && (
          <header
            className={`fixed top-0 right-0 z-40 h-14 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-end px-4 transition-all duration-300 ${
              collapsed ? "lg:left-16" : "lg:left-64"
            } left-0`}
          >
            <ProfileButton />
          </header>
        )}

        <main className={showShell ? `${collapsed ? "lg:pl-16" : "lg:pl-64"} pt-14 pb-20 lg:pb-0` : ""}>
          {children}
        </main>

        <Toaster />
      </>
    </AuthGuard>
  )
}
