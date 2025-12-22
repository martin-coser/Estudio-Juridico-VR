"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Scale, Home, Briefcase, Users, Calendar, Bell, LogOut } from "lucide-react"

const navigation = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Casos", href: "/casos", icon: Briefcase },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Notificaciones", href: "/notificaciones", icon: Bell },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const userEmail = user?.email || "usuario@estudio.com"

  return (
    <div className="flex h-full w-64 flex-col bg-card">
      {/* Logo + Título - Adaptado para móvil */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
          <Scale className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-foreground truncate sm:text-lg">
            Estudio Jurídico
          </h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Valentina Reineri
          </p>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Información del usuario y logout */}
      <div className="border-t border-border p-4">
        <div className="mb-3 rounded-lg bg-secondary/50 px-3 py-2">
          <p className="text-sm font-medium text-foreground truncate">
            {userEmail}
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
          <span className="sm:hidden">Salir</span>
        </Button>
      </div>
    </div>
  )
}