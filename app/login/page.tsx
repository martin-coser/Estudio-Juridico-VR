"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Scale, CheckCircle2, AlertCircle } from "lucide-react"
import { 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  sendPasswordResetEmail 
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Por favor, ingresa tu email primero para enviarte el enlace de recuperación.")
      return
    }
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess("Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.")
    } catch (err: any) {
      setError("Error: No se pudo enviar el correo. Verifica que el email sea correcto.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)

      if (isRegister) {
        await addDoc(collection(db, "solicitudes"), {
          email: email.toLowerCase().trim(),
          estado: "pendiente",
          fechaSolicitud: serverTimestamp(),
        })
        setSuccess("Solicitud enviada correctamente. Recibirás un email cuando el administrador autorice tu acceso.")
        setEmail("")
        setPassword("")
      } else {
        await signIn(email, password)
        router.push("/")
      }
    } catch (err: any) {
      console.error("Firebase Error Code:", err.code)
      
      // Personalización de mensajes de error
      if (!isRegister) {
        if (
          err.code === "auth/invalid-credential" || 
          err.code === "auth/user-not-found" || 
          err.code === "auth/wrong-password"
        ) {
          setError("Credenciales incorrectas, intenta de nuevo.")
        } else if (err.code === "auth/too-many-requests") {
          setError("Demasiados intentos fallidos. Intenta más tarde.")
        } else {
          setError("Ocurrió un error al iniciar sesión. Intenta nuevamente.")
        }
      } else {
        setError("No se pudo procesar la solicitud. Intenta más tarde.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-lg">
              <Scale className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Estudio Jurídico VR</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Valentina Reineri
              </CardDescription>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {isRegister ? "Solicita acceso al sistema" : "Accede a tu panel de gestión"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500/50 bg-green-500/10 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                {!isRegister && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contraseña</Label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs text-accent hover:underline font-medium"
                          disabled={loading}
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={!isRegister}
                        disabled={loading}
                        className="h-11"
                      />
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                        Mantener sesión iniciada
                      </Label>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRegister ? "Enviar Solicitud" : "Entrar")}
                </Button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister)
                  setSuccess("")
                  setError("")
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Solicita acceso"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}