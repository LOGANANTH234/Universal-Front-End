import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { LayoutContent } from "@/components/layout-content"
import { ShiftCacheProvider } from "@/lib/contexts/shift-cache-context"
import { EmployeeCacheProvider } from "@/lib/contexts/employee-cache-context"
import { AuthProvider } from "@/lib/contexts/auth-context"

const _geist     = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Universal",
  description: "Workforce Attendance Management",
  generator: "v0.app",
 icons: {
  icon: [
    { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
    { url: "/icon-dark-32x32.png",  media: "(prefers-color-scheme: dark)"  },
  ],
  apple: "/images/image.png",
},
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
              <LayoutContent>{children}</LayoutContent>
            </EmployeeCacheProvider>
          </ShiftCacheProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
