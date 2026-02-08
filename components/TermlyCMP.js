'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function TermlyCMP() {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Wait for hydration to complete before initializing Termly
    setMounted(true)
  }, [])

  useEffect(() => {
    // Initialize Termly after hydration completes and on route changes
    // Use a small delay to ensure React hydration is fully complete
    if (!mounted || typeof window === 'undefined') return

    const initializeTermly = () => {
      if (window.Termly) {
        try {
          window.Termly.initialize()
        } catch (error) {
          // Silently handle initialization errors
          console.error('[Termly] Initialization error:', error)
        }
      }
    }

    // Small delay to ensure hydration is complete
    const timeoutId = setTimeout(initializeTermly, 0)

    return () => clearTimeout(timeoutId)
  }, [mounted, pathname, searchParams])

  // Return null to avoid hydration issues - Termly injects its own DOM elements
  return null
}