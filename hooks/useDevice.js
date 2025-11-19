"use client"
import { useState, useEffect } from "react"

export default function useDevice(breakpoint = 965) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth <= breakpoint)

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [breakpoint])

  return isMobile
}
