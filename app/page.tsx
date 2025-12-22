"use client"

import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Briefcase, CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Case, Event } from "@/lib/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    casosActivos: 0,
    proximosVencimientos: 0,
    eventosHoy: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        let casosActivos = 0
        let proximosVencimientos = 0
        let eventosHoy = 0

        // === 1. CARGAR CASOS (para casos activos y vencimientos) ===
        const casesQuery = query(collection(db, "cases"))
        const casesSnap = await getDocs(casesQuery)
        casosActivos = casesSnap.size

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        nextWeek.setHours(23, 59, 59, 999)

        casesSnap.forEach((doc) => {
          const caso = doc.data() as Case

          // Contar plazos próximos (múltiples por caso)
          if (caso.plazos && caso.plazos.length > 0) {
            caso.plazos.forEach((plazo) => {
              if (!plazo.fecha) return
              const fechaPlazo = new Date(plazo.fecha)
              if (fechaPlazo >= today && fechaPlazo <= nextWeek) {
                proximosVencimientos++
              }
            })
          }
        })

        // === 2. CARGAR EVENTOS DE HOY ===
        const todayStr = today.toISOString().split("T")[0] // formato YYYY-MM-DD

        const eventsQuery = query(
          collection(db, "events"),
          where("fecha", "==", todayStr)
        )
        const eventsSnap = await getDocs(eventsQuery)
        eventosHoy = eventsSnap.size

        setStats({
          casosActivos,
          proximosVencimientos,
          eventosHoy,
        })
      } catch (error) {
        console.error("[v0] Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-b-4 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Título y descripción */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Resumen de actividades del estudio jurídico
          </p>
        </div>

        {/* Alertas permanentes */}
        <div className="grid gap-4 mb-8 sm:grid-cols-1 md:grid-cols-2">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-500">Recordatorio Importante</AlertTitle>
            <AlertDescription className="text-foreground">
              Recordar verificar oficios
            </AlertDescription>
          </Alert>

          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-500">Recordatorio Importante</AlertTitle>
            <AlertDescription className="text-foreground">
              Recordar controlar SAC
            </AlertDescription>
          </Alert>
        </div>

        {/* Cards de estadísticas */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Casos Activos
              </CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {stats.casosActivos}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Total de casos en gestión
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vencimientos Próximos
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {stats.proximosVencimientos}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Plazos en los próximos 7 días
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Eventos Hoy
              </CardTitle>
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {stats.eventosHoy}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Reuniones y audiencias programadas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}