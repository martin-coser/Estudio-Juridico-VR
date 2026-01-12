// components/NotificationToggle.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export function NotificationToggle() {
  const [status, setStatus] = useState<"idle" | "loading" | "enabled" | "denied">("idle");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Verificar si la función existe (solo si PusherBeamsInit se cargó)
    if (typeof window !== "undefined" && !(window as any).initPushNotifications) {
      setSupported(false);
    }
  }, []);

  const handleEnable = async () => {
    if (!supported) return;

    setStatus("loading");
    try {
      const success = await (window as any).initPushNotifications();
      setStatus(success ? "enabled" : "denied");
    } catch (err) {
      console.error(err);
      setStatus("denied");
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        No soportado en este dispositivo
      </div>
    );
  }

  if (status === "enabled") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        Notificaciones activadas
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleEnable}
      disabled={status === "loading"}
      className="gap-2"
    >
      {status === "loading" ? (
        <>Activando...</>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Activar notificaciones
        </>
      )}
    </Button>
  );
}