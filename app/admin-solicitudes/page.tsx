"use client"

import { useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { sendSignInLinkToEmail } from "firebase/auth"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Send, Scale, Clock, UserCheck } from "lucide-react"

// Reemplaza esto con tu UID real de Firebase Authentication
const ADMIN_UID = "SWuK09UZJ5fJ6YSPtcNFDVRePbV2";

export default function AdminSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // 1. Verificación de Seguridad: Solo el dueño entra
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.uid !== ADMIN_UID) {
        router.push("/")
      }
    }
  }, [user, authLoading, router])

  // 2. Escuchar solicitudes en tiempo real
  useEffect(() => {
    if (user && user.uid === ADMIN_UID) {
      const q = query(collection(db, "solicitudes"), orderBy("fechaSolicitud", "desc"))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setSolicitudes(snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })))
      })
      return () => unsubscribe()
    }
  }, [user])

  // 3. Función para autorizar
  const autorizarUsuario = async (id: string, email: string) => {
    setLoadingId(id)
    try {
      const actionCodeSettings = {
        // La URL a la que irá el usuario al abrir su mail
        url: `${window.location.origin}/confirmar-acceso`,
        handleCodeInApp: true,
      }

      // Enviamos link de registro (Plan Spark)
      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      
      // Guardamos el email en localStorage para que sea más fácil al usuario
      window.localStorage.setItem('emailForSignIn', email)

      // Borramos la solicitud de la lista
      await deleteDoc(doc(db, "solicitudes", id))
      
      alert(`Invitación enviada correctamente a: ${email}`)
    } catch (error: any) {
      console.error(error)
      alert("Error al procesar: " + error.message)
    } finally {
      setLoadingId(null)
    }
  }

  // Pantalla de carga mientras verifica si eres admin
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-muted-foreground animate-pulse">Verificando credenciales de administrador...</p>
      </div>
    )
  }

  // Si no es el admin, no mostramos nada (la redirección ocurre en el useEffect)
  if (!user || user.uid !== ADMIN_UID) return null

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado del Panel */}
        <div className="flex items-center gap-4 border-b pb-6">
          <div className="bg-accent p-3 rounded-xl shadow-lg">
            <Scale className="h-8 w-8 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Panel de Control</h1>
            <p className="text-muted-foreground">Gestión de solicitudes de acceso al sistema</p>
          </div>
        </div>

        {/* Lista de Solicitudes */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Solicitudes Pendientes ({solicitudes.length})
          </h2>

          {solicitudes.length === 0 ? (
            <Card className="border-dashed bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <UserCheck className="h-12 w-12 mb-4 opacity-20" />
                <p>No hay solicitudes de registro por el momento.</p>
              </CardContent>
            </Card>
          ) : (
            solicitudes.map((sol) => (
              <Card key={sol.id} className="overflow-hidden transition-all hover:shadow-md">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <p className="text-lg font-bold text-foreground">
                        {sol.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Solicitado el: {sol.fechaSolicitud?.toDate().toLocaleString() || 'Fecha no disponible'}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => autorizarUsuario(sol.id, sol.email)}
                      disabled={loadingId === sol.id}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2 h-11 px-6 shadow-sm"
                    >
                      {loadingId === sol.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Autorizar Acceso
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}