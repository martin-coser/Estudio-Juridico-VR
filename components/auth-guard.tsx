"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Pantalla de carga completa mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-6">
          {/* Logo del estudio (opcional, pero queda muy pro) */}
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>

          {/* Spinner más elegante */}
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-border"></div>
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
          </div>

          {/* Texto opcional */}
          <p className="text-muted-foreground text-sm">Cargando panel de gestión...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario después de cargar → redirige (no renderiza nada)
  if (!user) {
    return null
  }

  // Usuario autenticado → renderiza el contenido protegido
  return <>{children}</>
}