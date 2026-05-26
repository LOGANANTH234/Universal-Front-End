/**
 * Centralized API client with automatic JWT token management
 * Handles token injection, expiration checking, and authentication errors
 */

interface ApiClientOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
  isPublic?: boolean // Set to true for public endpoints like /auth/login
}

interface AuthData {
  token: string
  expiresAt: number
  employeeId: string
  employeeName: string
}

/**
 * Get authentication data from localStorage
 */
function getAuthData(): AuthData | null {
  if (typeof window === "undefined") return null

  try {
    const authStr = localStorage.getItem("auth")
    if (!authStr) return null

    const auth = JSON.parse(authStr)
    return auth
  } catch (error) {
    console.error("[v0] Error reading auth from localStorage:", error)
    return null
  }
}

/**
 * Check if the token is expired
 */
function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt
}

/**
 * Clear auth data and redirect to login
 */
function handleAuthenticationFailure() {
  if (typeof window === "undefined") return

  localStorage.removeItem("auth")
  localStorage.removeItem("auth_raw")

  // Redirect to login page
  window.location.href = "/login"
}

/**
 * Centralized API client for all backend requests
 * Automatically injects JWT token for protected endpoints
 */
export async function apiClient(url: string, options: ApiClientOptions = {}) {
  const { method = "GET", body, headers = {}, isPublic = false } = options

  // Prepare request headers
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  }

  // Add Authorization header for protected endpoints
  if (!isPublic) {
    const auth = getAuthData()

    // Check if user is authenticated
    if (!auth || !auth.token) {
      console.error("[v0] No authentication token found")
      handleAuthenticationFailure()
      throw new Error("Authentication required")
    }

    // Check if token is expired
    if (isTokenExpired(auth.expiresAt)) {
      console.error("[v0] Token has expired")
      handleAuthenticationFailure()
      throw new Error("Token expired")
    }

    // Add JWT token to request
    requestHeaders["Authorization"] = `Bearer ${auth.token}`
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body) {
    requestOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, requestOptions)

    // Handle 401 Unauthorized - token is invalid or expired
    if (response.status === 401) {
      console.error("[v0] Unauthorized (401) - token invalid or expired")
      handleAuthenticationFailure()
      throw new Error("Unauthorized")
    }

    if (response.status === 400) {
      try {
        const errorData = await response.json()
        // If there are validation messages in the response, include them in the error
        if (errorData.validationMessages && Array.isArray(errorData.validationMessages)) {
          const error: any = new Error("Validation failed")
          error.status = 400
          error.validationMessages = errorData.validationMessages
          throw error
        }
        // Otherwise throw a generic validation error
        throw new Error(errorData.message || "Bad request")
      } catch (parseError) {
        // If parsing fails, throw generic error
        if (parseError instanceof Error && parseError.message === "Validation failed") {
          throw parseError
        }
        throw new Error("Bad request")
      }
    }

    // Handle other HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response
  } catch (error) {
    console.error("[v0] API request failed:", error)
    throw error
  }
}

/**
 * Helper function to make GET requests
 */
export async function apiGet(url: string, isPublic = false) {
  const response = await apiClient(url, { method: "GET", isPublic })
  return response.json()
}

/**
 * Helper function to make POST requests
 */
export async function apiPost(url: string, body: any, isPublic = false) {
  const response = await apiClient(url, { method: "POST", body, isPublic })
  return response.json()
}

/**
 * Helper function to make PUT requests
 */
export async function apiPut(url: string, body: any, isPublic = false) {
  const response = await apiClient(url, { method: "PUT", body, isPublic })
  return response.json()
}

/**
 * Helper function to make DELETE requests
 */
export async function apiDelete(url: string, isPublic = false) {
  const response = await apiClient(url, { method: "DELETE", isPublic })

  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }

  // Return text response for plain text endpoints
  return response.text()
}
