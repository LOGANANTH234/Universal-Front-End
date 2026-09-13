import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/branding-config"

const BACKEND = process.env.API_BASE_URL || API_BASE_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const upstream = await fetch(`${BACKEND}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error("[proxy] /api/auth/login →", err)
    return NextResponse.json(
      { validationMessages: ["Unable to reach the server. Please try again."] },
      { status: 503 },
    )
  }
}
