"use client"

import { useAuth } from "@/hooks/use-auth"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AppHeader() {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Panel de Gestión</h1>
        <p className="text-sm text-muted-foreground">Bienvenido, {user?.email?.split("@")[0]}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notificaciones">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notificaciones</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
