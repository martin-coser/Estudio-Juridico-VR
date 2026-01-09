"use client"

import PusherBeamsInit from "@/components/PusherBeamsInit"
import { Toaster } from "@/components/ui/toaster"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PusherBeamsInit />  {/* Se inicializa solo en cliente */}
      {children}
      <Toaster />          {/* Toasts también suelen necesitar cliente */}
    </>
  )
}