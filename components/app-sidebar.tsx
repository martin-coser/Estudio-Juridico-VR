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

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Scale className="w-6 h-6 text-slate-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">Estudio Jurídico</h2>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
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
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info and logout */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="px-2">
          <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground">Abogado</p>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
