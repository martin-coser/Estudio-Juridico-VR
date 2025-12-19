"use client"

import { useAuth } from "@/hooks/use-auth"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AppHeader() {
  const { user } = useAuth()
  const userName = user?.email?.split("@")[0] || "Usuario"

  return (
    <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between">
      <div className="flex flex-col justify-center min-w-0 flex-1">
        {/* Título principal - siempre visible */}
        <h1 className="text-lg font-semibold text-foreground truncate">
          Panel de Gestión
        </h1>
        
        {/* Saludo - oculto en móvil muy pequeño, visible desde sm+ */}
        <p className="hidden sm:block text-sm text-muted-foreground truncate">
          Bienvenido, {userName}
        </p>
        
        {/* Versión móvil del saludo - solo visible en pantallas pequeñas */}
        <p className="sm:hidden text-xs text-muted-foreground truncate">
          Hola, {userName}
        </p>
      </div>

      {/* Botón de notificaciones */}
      <Button variant="ghost" size="icon" className="shrink-0" asChild>
        <Link href="/notificaciones" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
        </Link>
      </Button>
    </header>
  )
}