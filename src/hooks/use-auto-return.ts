"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useAutoReturn(timeout = 60000) {
  const router = useRouter()

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        router.push("/")
      }, timeout)
    }

    // Set up event listeners for user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]

    // Start the timer
    resetTimer()

    // Reset the timer on user activity
    events.forEach((event) => {
      document.addEventListener(event, resetTimer)
    })

    // Clean up
    return () => {
      clearTimeout(inactivityTimer)
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [router, timeout])
}

