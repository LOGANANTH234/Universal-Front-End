'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DailySalaryPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/salary')
  }, [router])
  
  return null
}
