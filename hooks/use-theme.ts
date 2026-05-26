"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Single source of truth for dark/light theme.
 *
 * Initial state is read from <html class="dark"> which the layout.tsx
 * inline script already set correctly before React hydrated.
 * This means the toggle button icon is always in sync from the first render.
 *
 * The OS prefers-color-scheme is deliberately never consulted.
 * localStorage "theme" = "dark" | "light" is the authority.
 */
export function useTheme() {
  // Read the html class that the layout script already set.
  // On the server this is always false (no DOM) — that's fine,
  // suppressHydrationWarning on <html> handles the mismatch.
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false
    return document.documentElement.classList.contains("dark")
  })

  // Keep state in sync if something else changes the class externally
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark")
    if (next) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
    setDark(next)
  }, [])

  return { dark, toggleTheme }
}
