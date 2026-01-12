// components/ClientProviders.tsx
"use client";

import { Toaster } from "@/components/ui/toaster";
import dynamic from "next/dynamic";

// Carga PusherBeamsInit solo en el cliente, nunca en el servidor
const PusherBeamsInit = dynamic(
  () => import("@/components/PusherBeamsInit"),
  { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PusherBeamsInit />
      {children}
      <Toaster />
    </>
  );
}