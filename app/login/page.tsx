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
import { Scale } from "lucide-react"
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth"
import { auth } from "@/lib/firebase"   

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)  
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 1. Configuramos la persistencia ANTES del login/registro
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)

      // 2. Ejecutamos el login o registro
      if (isRegister) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }

      router.push("/")
    } catch (err: any) {
      setError(err.message || "Ocurrió un error")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)

    try {
      // Aplicamos la misma persistencia también al login con Google
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)

      await signInWithGoogle()
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Ocurrió un error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          {/* Logo y título */}
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center shadow-lg">
              <Scale className="w-10 h-10 text-accent-foreground drop-shadow-sm" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Estudio Jurídico
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-2 font-medium">
                Valentina Reineri
              </CardDescription>
              <p className="text-sm text-muted-foreground/80">
                {isRegister ? "Crea tu cuenta" : "Accede a tu panel"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-0">
            {/* Error */}
            {error && (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base focus-visible:ring-2 focus-visible:ring-accent"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-base focus-visible:ring-2 focus-visible:ring-accent"
                  disabled={loading}
                />
              </div>

              {/* Checkbox "Mantener sesión iniciada" */}
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                  disabled={loading}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none text-muted-foreground cursor-pointer"
                >
                  Mantener sesión iniciada
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Cargando...</span>
                  </div>
                ) : isRegister ? (
                  "Crear Cuenta"
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            {/* Toggle Register/Login */}
            <div className="text-center pt-4 pb-6 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium underline-offset-2 hover:underline"
                disabled={loading}
              >
                {isRegister 
                  ? "¿Ya tienes cuenta? Inicia sesión" 
                  : "¿No tienes cuenta? Crea una ahora"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}