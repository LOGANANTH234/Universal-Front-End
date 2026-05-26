"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface ModuleAction {
  actionCode: string
  actionName?: string
}

interface Module {
  moduleCode: string
  moduleName?: string
  actions: ModuleAction[]
}

interface AuthContextType {
  auth: AuthData | null
  isLoading: boolean
  error: string | null
  logout: () => void
  setAuth: (authData: AuthData) => void
}

interface AuthData {
  token: string
  employeeId: string
  employeeName: string
  roleName: string
  modules: Module[]
  expiresAt: number
}

interface JwtPayload {
  exp: number
  [key: string]: any
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

function decodeJwt(token: string): JwtPayload {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("[v0] JWT decode error:", error)
    throw new Error("Failed to decode JWT token")
  }
}

function normalizeAuthData(rawAuth: any): AuthData {
  const decoded = decodeJwt(rawAuth.token)
  const modules: Module[] = (rawAuth.moduleTreeResponseDtoList || rawAuth.modules || []).map((m: any) => ({
    moduleCode: m.moduleCode || m.id,
    moduleName: m.moduleName || m.name,
    actions: (m.actions || []).map((a: any) => ({
      actionCode: a.actionCode,
      actionName: a.actionName,
    })),
  }))
  return {
    token: rawAuth.token,
    employeeId: rawAuth.employeeId,
    employeeName: rawAuth.employeeName,
    roleName: rawAuth.roleName || "",
    modules,
    expiresAt: decoded.exp * 1000,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [auth, setAuthState] = useState<AuthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // NOTE: Do NOT clear auth here — that was a dev shortcut that
      // logged users out on every page load. Read and restore instead.
      const storedAuth = localStorage.getItem("auth")
      if (storedAuth) {
        const parsedAuth: AuthData = JSON.parse(storedAuth)
        if (parsedAuth.expiresAt > Date.now()) {
          setAuthState(parsedAuth)
        } else {
          localStorage.removeItem("auth")
          localStorage.removeItem("auth_raw")
          setAuthState(null)
        }
      } else {
        const rawAuth = localStorage.getItem("auth_raw")
        if (rawAuth) {
          try {
            const normalized = normalizeAuthData(JSON.parse(rawAuth))
            if (normalized.expiresAt > Date.now()) {
              localStorage.setItem("auth", JSON.stringify(normalized))
              setAuthState(normalized)
            } else {
              localStorage.removeItem("auth_raw")
              setAuthState(null)
            }
          } catch (err) {
            console.error("[v0] Error normalizing auth data:", err)
            localStorage.removeItem("auth_raw")
            setAuthState(null)
          }
        }
      }
    } catch (err) {
      console.error("[v0] Error initializing auth:", err)
      setError(err instanceof Error ? err.message : "Failed to initialize auth")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-logout when JWT expires
  useEffect(() => {
    if (!auth) return
    const timeUntilExpiry = auth.expiresAt - Date.now()
    if (timeUntilExpiry <= 0) {
      logout()
      return
    }
    const timer = setTimeout(() => logout(), timeUntilExpiry)
    return () => clearTimeout(timer)
  }, [auth])

  const logout = useCallback(() => {
    setAuthState(null)
    setError(null)
    localStorage.removeItem("auth")
    localStorage.removeItem("auth_raw")
    // Redirect to home page (not /login) so user sees the landing page
    router.replace("/")
  }, [router])

  const setAuth = useCallback((authData: AuthData) => {
    setAuthState(authData)
    localStorage.setItem("auth", JSON.stringify(authData))
    localStorage.removeItem("auth_raw")
  }, [])

  return (
    <AuthContext.Provider value={{ auth, isLoading, error, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
