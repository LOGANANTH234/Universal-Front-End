import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")

    const response = await fetch(`${API_BASE_URL}/api/employees/picklist`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch employees from backend: ${response.status} - ${errorText}`)
      return NextResponse.json({ error: "Failed to fetch employees" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}
