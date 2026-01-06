"use client"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ConfirmarAcceso() {
  const router = useRouter()
  const [status, setStatus] = useState("Verificando el enlace...")

  useEffect(() => {
    // 1. Verificamos si la URL es un link de inicio de sesión válido
    if (isSignInWithEmailLink(auth, window.location.href)) {
      
      // Intentamos recuperar el email si se guardó en el mismo navegador
      let email = window.localStorage.getItem('emailForSignIn')
      
      // Si no está (abrió el mail en otro dispositivo), se lo pedimos
      if (!email) {
        email = window.prompt('Por seguridad, introduce tu email nuevamente:')
      }

      if (email) {
        setStatus("Creando tu cuenta oficial...")
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn')
            setStatus("¡Éxito! Redirigiendo...")
            setTimeout(() => router.push("/"), 2000)
          })
          .catch((error) => {
            console.error(error)
            setStatus("Error: El enlace expiró o es inválido.")
          })
      }
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Activación de Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
          <p className="text-muted-foreground">{status}</p>
        </CardContent>
      </Card>
    </div>
  )
}