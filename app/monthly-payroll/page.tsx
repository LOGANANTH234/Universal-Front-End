'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MonthlyPayrollPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/salary')
  }, [router])
  
  return null
}
