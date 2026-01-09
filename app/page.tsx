"use client"

import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button" // Asegúrate de tener este import
import { AlertCircle, Briefcase, CalendarIcon, Users, Key, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Case, Event } from "@/lib/types"
import Link from "next/link"

// Tu UID de Administrador
const ADMIN_UID = "SWuK09UZJ5fJ6YSPtcNFDVRePbV2"; 

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    casosActivos: 0,
    proximosVencimientos: 0,
    eventosHoy: 0,
  })
  const [loading, setLoading] = useState(true)

  // Verificamos si es administrador
  const isAdmin = user?.uid === ADMIN_UID;

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

        const casesQuery = query(collection(db, "cases"))
        const casesSnap = await getDocs(casesQuery)
        casosActivos = casesSnap.size

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        nextWeek.setHours(23, 59, 59, 999)

        casesSnap.forEach((doc) => {
          const caso = doc.data() as Case
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

        const todayStr = today.toISOString().split("T")[0]
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
        console.error("Error fetching dashboard stats:", error)
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
        
        {/* Encabezado con botón de solicitudes para el ADMIN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Resumen de actividades del estudio jurídico
            </p>
          </div>
          
          {isAdmin && (
            <Link href="/admin-solicitudes">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md flex gap-2 h-11 px-6">
                <Users className="h-5 w-5" />
                Solicitudes de Registro
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Button>
            </Link>
          )}
        </div>

        {/* Alertas de seguridad (Password) y recordatorios */}
        <div className="grid gap-4 mb-8 grid-cols-1 md:grid-cols-2">
          
          {/* Solo mostramos esta alerta si el usuario no ha puesto su contraseña o queremos recordárselo */}
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Key className="h-5 w-5 text-blue-500" />
            <AlertTitle className="text-blue-500">Configuración de Seguridad</AlertTitle>
            <AlertDescription className="text-foreground flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span>Para mayor seguridad, asegúrese de tener una contraseña establecida.</span>
              <Button variant="outline" size="sm" className="h-8 border-blue-500/50 hover:bg-blue-500/20" asChild>
                <Link href="/ajustes-seguridad">Configurar</Link>
              </Button>
            </AlertDescription>
          </Alert>

          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-500">Control SAC / Oficios</AlertTitle>
            <AlertDescription className="text-foreground">
              Verificar oficios pendientes y controlar sistema SAC hoy.
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
              <p className="mt-2 text-sm text-muted-foreground">Total de casos en gestión</p>
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
              <p className="mt-2 text-sm text-muted-foreground">Plazos en los próximos 7 días</p>
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
              <p className="mt-2 text-sm text-muted-foreground">Reuniones y audiencias</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}