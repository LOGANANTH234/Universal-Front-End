/**
 * Branding Configuration
 *
 * IF Condition:
 * - If true  -> show the icon and name as "Universal"
 * - If false -> show the icon as "/pixxel.png" and name as "pixxel"
 */

// Toggle this flag: set to true for Universal, or false for Pixxel
export const IS_UNIVERSAL: boolean = true

export const BRANDING = {
  isUniversal: IS_UNIVERSAL,
  name: IS_UNIVERSAL ? "Universal" : "Pixxel",
  description: IS_UNIVERSAL
    ? "Universal Workforce Attendance Management"
    : "Pixxel Workforce Attendance Management",
  favicon: IS_UNIVERSAL ? "/icon-light-32x32.png" : "/pixxel.png",
  icons: IS_UNIVERSAL
    ? {
      icon: [
        { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
        { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      ],
      apple: "/images/image.png",
    }
    : {
      icon: [{ url: "/pixxel.png" }],
      apple: "/pixxel.png",
    },
}

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  "http://13.206.112.19:8080"



