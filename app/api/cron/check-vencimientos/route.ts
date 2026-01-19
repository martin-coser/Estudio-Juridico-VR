import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import PushNotifications from "@pusher/push-notifications-server";
import { formatDate } from '@/lib/formatDate';

// === Firebase Admin ===
if (!admin.apps.length) {
  try {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!rawJson) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no encontrada");
    const serviceAccount = JSON.parse(rawJson);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("✅ Firebase Admin inicializado");
  } catch (error: any) {
    console.error("❌ Error en Firebase Admin:", error.message);
  }
}

const db = admin.firestore();

// === Pusher Beams ===
const beamsClient = new PushNotifications({
  instanceId: process.env.PUSHER_INSTANCE_ID!,
  secretKey: process.env.PUSHER_SECRET_KEY!,
});

// === Twilio ===
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Función para enviar SMS a múltiples destinatarios
async function sendSmsToAll(message: string) {
  const recipients = (process.env.SMS_RECIPIENTS || '')
    .split(',')
    .map(n => n.trim())
    .filter(n => n.startsWith('+')); // Solo números válidos

  if (recipients.length === 0) {
    console.warn("⚠️ No hay destinatarios SMS configurados");
    return 0;
  }

  let sentCount = 0;
  for (const to of recipients) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: to,
      });
      console.log(`📱 SMS enviado a ${to}`);
      sentCount++;
    } catch (err: any) {
      console.error(`❌ Error al enviar SMS a ${to}:`, err.message);
    }
  }
  return sentCount;
}

// === Cron Job Principal ===
export async function GET() {
  try {
    const ahoraDate = new Date();
    const LIMITE_3_DIAS_MS = 3 * 24 * 60 * 60 * 1000;
    const tiempoAhora = ahoraDate.getTime();
    const tiempoLimite = tiempoAhora + LIMITE_3_DIAS_MS;

    let totalPush = 0;
    let totalSms = 0;

    // --- 1. PROCESAR CASES ---
    const casesSnapshot = await db.collection('cases').get();

    for (const caseDoc of casesSnapshot.docs) {
      const caso = caseDoc.data();
      const expediente = caso.expediente || 'S/N';

      // PLAZOS
      const plazos = caso.plazos || [];
      for (const plazo of plazos) {
        if (plazo.fecha) {
          const fechaPlazo = new Date(plazo.fecha);
          if (fechaPlazo.getTime() <= tiempoLimite && fechaPlazo.getTime() >= (tiempoAhora - 86400000)) {
            const fechaFormateada = formatDate(plazo.fecha);
            
            const title = 'PLAZO PROXIMO';
            const body = `${plazo.nombre || 'Vencimiento'} (Fecha: ${fechaFormateada}) - Exp: ${expediente}`;

            // Notificación push → con emoji
            await beamsClient.publishToInterests(["hello"], {
              web: { 
                notification: { 
                  title: '🔴 ' + title, 
                  body, 
                  icon: 'https://estudio-juridico-vr.vercel.app/balanza.jpg' 
                }
              }
            });
            totalPush++;

            // SMS → sin emojis
            totalSms += await sendSmsToAll(`${title}\n${body}`);
          }
        }
      }

      // OFICIOS
      const oficios = caso.oficios || [];
      for (const oficio of oficios) {
        if (!oficio.completado) {
          const title = 'OFICIO PENDIENTE';
          const body = `${oficio.titulo || 'Oficio'} - Exp: ${expediente}`;

          await beamsClient.publishToInterests(["hello"], {
            web: { 
              notification: { 
                title: '📂 ' + title, 
                body, 
                icon: 'https://estudio-juridico-vr.vercel.app/balanza.jpg' 
              }
            }
          });
          totalPush++;

          totalSms += await sendSmsToAll(`${title}\n${body}`);
        }
      }

      // TAREAS
      const tareas = caso.tareas || [];
      for (const tarea of tareas) {
        if (!tarea.completado) {
          const title = 'TAREA PENDIENTE';
          const body = `${tarea.titulo || 'Tarea'} - Exp: ${expediente}`;

          await beamsClient.publishToInterests(["hello"], {
            web: { 
              notification: { 
                title: '✅ ' + title, 
                body, 
                icon: 'https://estudio-juridico-vr.vercel.app/balanza.jpg' 
              }
            }
          });
          totalPush++;

          totalSms += await sendSmsToAll(`${title}\n${body}`);
        }
      }
    }

    // --- 2. EVENTOS DE AGENDA ---
    const eventsSnapshot = await db.collection('events').get();
    for (const eventDoc of eventsSnapshot.docs) {
      const evento = eventDoc.data();
      if (evento.fecha) {
        const fechaEv = new Date(evento.fecha);
        if (fechaEv.getTime() <= tiempoLimite && fechaEv.getTime() >= (tiempoAhora - 86400000)) {
          const fechaFormateada = formatDate(evento.fecha);
          
          const title = 'EVENTO EN AGENDA';
          const body = `${evento.titulo || 'Sin título'} (Fecha: ${fechaFormateada})`;

          await beamsClient.publishToInterests(["hello"], {
            web: { 
              notification: { 
                title: '📅 ' + title, 
                body, 
                icon: 'https://estudio-juridico-vr.vercel.app/balanza.jpg' 
              }
            }
          });
          totalPush++;

          totalSms += await sendSmsToAll(`${title}\n${body}`);
        }
      }
    }

    console.log(`📧 Push: ${totalPush} | 📱 SMS: ${totalSms}`);
    return NextResponse.json({ success: true, push: totalPush, sms: totalSms });

  } catch (error: any) {
    console.error("💥 Error en cron:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}