import { AppNavigation } from '@/components/app-navigation'

export default function EmployeesPage() {
  return (
    <>
      <AppNavigation />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 sm:p-8">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Employees</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Employee management module coming soon...</p>
          </div>
        </div>
      </div>
    </>
  )
}
