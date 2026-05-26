"use client"

import { useRouter } from "next/navigation"
import { ShieldX, Home, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/contexts/auth-context"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { logout } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="h-10 w-10 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is an
          error.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => router.push("/")} variant="default" className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            Go to Home
          </Button>
          <Button
            onClick={() => {
              logout()
            }}
            variant="outline"
            className="flex-1"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
