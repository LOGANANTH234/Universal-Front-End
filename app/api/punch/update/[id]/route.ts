import { NextRequest, NextResponse } from 'next/server'

interface PunchUpdateRequest {
  date: string
  hour: string
  minute: string
  amPm: 'AM' | 'PM'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: PunchUpdateRequest = await request.json()

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[v0] Punch update request for ID:', id)
    console.log('[v0] Request body:', body)

    // Forward to backend API
    const response = await fetch(
      `http://localhost:8080/api/punch/${id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()
    console.log('[v0] Backend response status:', response.status)
    console.log('[v0] Backend response:', data)

    // Handle backend validation errors
    if (!response.ok) {
      // Extract validation messages if available
      if (data.validationMessages && Array.isArray(data.validationMessages)) {
        return NextResponse.json(
          { validationMessages: data.validationMessages },
          { status: response.status }
        )
      }

      // Generic error response
      return NextResponse.json(
        { error: data.error || 'Failed to update punch' },
        { status: response.status }
      )
    }

    // Success response
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in punch update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
