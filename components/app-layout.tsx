"use client"

import type React from "react"
import { useState } from "react"

import { AuthGuard } from "./auth-guard"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar - Desktop: siempre visible | Mobile: overlay */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out
            lg:relative lg:translate-x-0 lg:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex h-full flex-col">
            <AppSidebar />
          </div>
        </aside>

        {/* Overlay oscuro cuando sidebar está abierto en móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header con botón hamburguesa en móvil */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Reutilizamos el AppHeader normal, pero movemos el contenido a la derecha */}
            <div className="flex-1">
              <AppHeader />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}