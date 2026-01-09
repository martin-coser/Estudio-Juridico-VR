import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/use-auth"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import Script from "next/script"
import { ClientProviders } from "@/components/clientProviders"

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
  return (
    <html lang="es" className="h-full">
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body className={`
        h-full bg-background font-sans antialiased
        ${geistSans.variable} ${geistMono.variable}
      `}>
        <AuthProvider>
          <div className="flex flex-col h-full">
            <ClientProviders>
              {children}
            </ClientProviders>
          </div>
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