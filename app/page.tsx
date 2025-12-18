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
        // Count active cases
        const casesRef = collection(db, "cases")
        const casesSnap = await getDocs(query(casesRef))
        const casosActivos = casesSnap.size

        // Count upcoming deadlines (cases with plazo in next 7 days)
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

        // Count today's events
        const eventsRef = collection(db, "events")
        const todayStr = today.toISOString().split("T")[0]
        const eventsSnap = await getDocs(query(eventsRef, where("fecha", "==", todayStr), orderBy("hora")))

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
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Resumen de actividades del estudio</p>
        </div>

        {/* Permanent alerts */}
        <div className="grid gap-4">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-500">Recordatorio Importante</AlertTitle>
            <AlertDescription className="text-foreground">Recordar verificar oficios</AlertDescription>
          </Alert>

          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-500">Recordatorio Importante</AlertTitle>
            <AlertDescription className="text-foreground">Recordar controlar SAC</AlertDescription>
          </Alert>
        </div>

        {/* Stats cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Casos Activos</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.casosActivos}</div>
              <CardDescription className="mt-1">Total de casos en gestión</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vencimientos Próximos Plazos</CardTitle>
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.proximosVencimientos}</div>
              <CardDescription className="mt-1">En los próximos 7 días</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Hoy</CardTitle>
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.eventosHoy}</div>
              <CardDescription className="mt-1">Reuniones y audiencias</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
