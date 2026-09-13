import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { LayoutContent } from "@/components/layout-content"
import { ShiftCacheProvider } from "@/lib/contexts/shift-cache-context"
import { EmployeeCacheProvider } from "@/lib/contexts/employee-cache-context"
import { BonusCacheProvider } from "@/lib/contexts/bonus-cache-context"
import { SettingsCacheProvider } from "@/lib/contexts/settings-cache-context"
import { HolidayCacheProvider } from "@/lib/contexts/holiday-cache-context"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { BRANDING } from "@/lib/branding-config"

const _geist     = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: BRANDING.name,
  description: BRANDING.description,
  generator: "v0.app",
  icons: BRANDING.icons,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Runs before first paint.
          - If saved preference is "dark"  → add class "dark"
          - Everything else (no value / "light") → remove "dark", save "light"
          Default is always LIGHT. OS/system theme is never consulted.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var t=localStorage.getItem("theme");if(t==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark");localStorage.setItem("theme","light")}}catch(e){document.documentElement.classList.remove("dark")}}()`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ShiftCacheProvider>
            <EmployeeCacheProvider>
              <BonusCacheProvider>
                <SettingsCacheProvider>
                  <HolidayCacheProvider>
                    <LayoutContent>{children}</LayoutContent>
                  </HolidayCacheProvider>
                </SettingsCacheProvider>
              </BonusCacheProvider>
            </EmployeeCacheProvider>
          </ShiftCacheProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
