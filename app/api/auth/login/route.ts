import { type NextRequest, NextResponse } from "next/server"

/**
 * Proxies POST /api/auth/login → Spring Boot backend.
 *
 * For local dev the backend runs on http://localhost:8080 by default.
 * In production, set  API_BASE_URL=http://your-server:8080  in .env.local
 * (server-side env var — no NEXT_PUBLIC_ needed here).
 */
const BACKEND = process.env.API_BASE_URL ?? "http://localhost:8080"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const upstream = await fetch(`${BACKEND}/api/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
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
