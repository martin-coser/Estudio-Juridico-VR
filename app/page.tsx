"use client"

import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Briefcase, CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Case } from "@/lib/types"

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
      if (!user) return

      try {
        const casesRef = collection(db, "cases")
        const casesSnap = await getDocs(query(casesRef))
        const casosActivos = casesSnap.size

        // Vencimientos próximos (próximos 7 días)
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        const casesWithDeadlines = casesSnap.docs.filter((doc) => {
          const caseData = doc.data() as Case
          if (caseData.plazo) {
            const plazoDate = new Date(caseData.plazo)
            return plazoDate >= today && plazoDate <= nextWeek
          }
          return false
        })

        // Eventos de hoy
        const eventsRef = collection(db, "events")
        const todayStr = today.toISOString().split("T")[0]
        const eventsSnap = await getDocs(
          query(eventsRef, where("fecha", "==", todayStr), orderBy("hora"))
        )

        setStats({
          casosActivos,
          proximosVencimientos: casesWithDeadlines.length,
          eventosHoy: eventsSnap.size,
        })
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
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
                En los próximos 7 días
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
                Reuniones y audiencias
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}