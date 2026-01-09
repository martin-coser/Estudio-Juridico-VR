import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import Script from "next/script"
import dynamic from "next/dynamic"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Estudio Jurídico - Valentina Reineri",
  description: "Sistema de gestión para estudios jurídicos",
  generator: "v0.app",
  icons: {
      icon: "https://estudio-juridico-vr.vercel.app/balanza.jpg", 
      apple: "https://estudio-juridico-vr.vercel.app/balanza.jpg",
    },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const PusherBeamsInit = dynamic(
  () => import("@/components/PusherBeamsInit"),
  { ssr: false }
  )
  return (
    <html lang="es" className="h-full">
      <body className={`
        h-full bg-background font-sans antialiased
        ${geistSans.variable} ${geistMono.variable}
      `}>
        <PusherBeamsInit />
        <AuthProvider>
          <div className="flex flex-col h-full">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
        <Analytics />
        <Script
          src="https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js"
          strategy="afterInteractive"  
        />
      </body>
    </html>
  )
}