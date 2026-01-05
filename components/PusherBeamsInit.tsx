"use client"; // Obligatorio para usar useEffect y el SDK de Pusher

import { useEffect } from "react";
import * as PusherPushNotifications from "@pusher/push-notifications-web";

export default function PusherBeamsInit() {
  useEffect(() => {
    // Esta lógica solo se ejecuta en el navegador
    const beamsClient = new PusherPushNotifications.Client({
      instanceId: '65b8c8e3-d6de-4962-a65d-e1aa4c9da788',
    });

    beamsClient.start()
      .then(() => beamsClient.addDeviceInterest('hello'))
      .then(() => console.log('Successfully registered and subscribed!'))
      .catch(console.error);
  }, []);

  return null; // Este componente no renderiza nada visualmente
}