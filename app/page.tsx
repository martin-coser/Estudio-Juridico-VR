"use client"

import { AppLayout } from "@/components/app-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Briefcase, CalendarIcon, Users, Key, ChevronRight, FileText, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Case } from "@/lib/types"
import Link from "next/link"

const ADMIN_UID = "Ghk0CMPZxuc94lniK5Ig162vy8j1"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    casosActivos: 0,
    proximosVencimientos: 0,
    eventosHoy: 0,
    pendientesTotales: 0,
  })
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.uid === ADMIN_UID

  useEffect(() => {
    setIsClient(true)

    const fetchStats = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        let casosActivos = 0
        let proximosVencimientos = 0
        let eventosHoy = 0
        let pendientesTotales = 0

        const casesQuery = query(collection(db, "cases"))
        const casesSnap = await getDocs(casesQuery)
        casosActivos = casesSnap.size

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const nextWeek = new Date(today)
        nextWeek.setDate(today.getDate() + 7)
        nextWeek.setHours(23, 59, 59, 999)

        casesSnap.forEach((doc) => {
          const caso = doc.data() as Case
          
          if (caso.plazos?.length) {
            caso.plazos.forEach((plazo) => {
              if (!plazo.fecha) return
              const fechaPlazo = new Date(plazo.fecha)
              if (fechaPlazo >= today && fechaPlazo <= nextWeek) {
                proximosVencimientos++
              }
            })
          }

          // Conteo de Pendientes (Oficios + Tareas no entregados)
          const oficiosCount = caso.oficios?.filter(o => !o.entregado).length || 0
          const tareasCount = caso.tareas?.filter(t => !t.entregado).length || 0
          pendientesTotales += (oficiosCount + tareasCount)
        })

        const todayStr = today.toISOString().slice(0, 10)
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
          pendientesTotales
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const showSkeleton = !isClient || loading

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado */}
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

        {/* Alertas fijas */}
        <div className="grid gap-4 mb-8 grid-cols-1 md:grid-cols-2">
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Casos Activos</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {showSkeleton ? "—" : stats.casosActivos}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Total de casos en gestión</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vencimientos</CardTitle>
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {showSkeleton ? "—" : stats.proximosVencimientos}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Próximos 7 días</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Hoy</CardTitle>
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {showSkeleton ? "—" : stats.eventosHoy}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Agenda diaria</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {showSkeleton ? "—" : stats.pendientesTotales}
              </div>
              <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Oficios y tareas
              </p>
            </CardContent>
          </Card>

        </div>

        {loading && isClient && (
          <div className="flex justify-center mt-8">
            <div className="h-8 w-8 animate-spin rounded-full border-t-4 border-b-4 border-primary"></div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}