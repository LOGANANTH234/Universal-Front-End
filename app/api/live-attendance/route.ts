import { API_BASE_URL } from "@/lib/branding-config"
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const response = await fetch(`${API_BASE_URL}/api/live-attendance`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error in live-attendance API route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch live attendance' },
      { status: 500 }
    )
  }
}
