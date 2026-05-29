import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[v0] Punch delete request for ID:', id)

    // Forward to backend API
    const response = await fetch(
      `http://localhost:8080/api/punch/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      }
    )

    console.log('[v0] Delete backend response status:', response.status)

    // Handle response
    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        const errorText = await response.text()
        return NextResponse.json(
          { error: errorText || 'Failed to delete punch' },
          { status: response.status }
        )
      }

      if (errorData.validationMessages && Array.isArray(errorData.validationMessages)) {
        return NextResponse.json(
          { validationMessages: errorData.validationMessages },
          { status: response.status }
        )
      }

      return NextResponse.json(
        { error: errorData.error || 'Failed to delete punch' },
        { status: response.status }
      )
    }

    // Success response
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in punch delete API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
