"use client"

import useDevice from "@/hooks/useDevice"

export default function ResponsiveChart({
  mobile,
  desktop,
  breakpoint = 965,
}) {
  const isMobile = useDevice(breakpoint)

  // Solo renderiza UNA versión, nunca ambas
  return isMobile ? mobile : desktop
}
