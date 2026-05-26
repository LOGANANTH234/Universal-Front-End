"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Moon, Sun } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/contexts/auth-context"
import { useTheme } from "@/hooks/use-theme"

export function ProfileButton() {
  const router = useRouter()
  const { auth, logout } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  if (!auth) return null

  const firstLetter = auth.employeeId?.charAt(0)?.toUpperCase() ?? "U"

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      localStorage.removeItem("auth")
      localStorage.removeItem("auth_raw")
      sessionStorage.clear()
      logout()
      // Redirect to home page, not login
      router.replace("/")
    } catch (error) {
      console.error("Logout error:", error)
      router.replace("/")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {firstLetter}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-0">
        {/* Profile header */}
        <div className="flex flex-col items-center py-6 px-4 bg-secondary border-b border-border rounded-t-md">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-semibold mb-3">
            {firstLetter}
          </div>
          <p className="text-base font-medium text-foreground">
            {auth.employeeId} — {auth.employeeName}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{auth.roleName}</p>
        </div>

        {/* Actions */}
        <div className="py-2">
          <DropdownMenuItem
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
          >
            {dark
              ? <Sun  className="h-4 w-4 text-muted-foreground" />
              : <Moon className="h-4 w-4 text-muted-foreground" />
            }
            <span className="text-sm">{dark ? "Light Mode" : "Dark Mode"}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">{isLoading ? "Logging out..." : "Logout"}</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
