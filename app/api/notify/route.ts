import PushNotifications from "@pusher/push-notifications-server";
import { NextResponse } from "next/server";

const beamsClient = new PushNotifications({
  instanceId: process.env.PUSHER_INSTANCE_ID!,
  secretKey: process.env.PUSHER_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    const { titulo, mensaje, link } = await request.json();

    await beamsClient.publishToInterests(["hello"], {
      web: {
        notification: {
          title: titulo,
          body: mensaje,
          icon: "https://tu-app-en-render.onrender.com/balanza.jpg",
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}