import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import PushNotifications from "@pusher/push-notifications-server";
import { formatDate } from '@/lib/formatDate';
import twilio from 'twilio';

// === 1. CONFIGURACIÓN DE FIREBASE ===
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

// === 2. CONFIGURACIÓN DE PUSHER BEAMS ===
const beamsClient = new PushNotifications({
  instanceId: process.env.PUSHER_INSTANCE_ID!,
  secretKey: process.env.PUSHER_SECRET_KEY!,
});

// === 3. CONFIGURACIÓN DE TWILIO (WHATSAPP) ===
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Envía un resumen unificado por WhatsApp a todos los destinatarios configurados.
 */
async function sendWhatsAppSummary(content: string) {
  const recipients = (process.env.SMS_RECIPIENTS || '')
    .split(',')
    .map(n => n.trim())
    .filter(n => n.startsWith('+'));

  if (recipients.length === 0 || content === '') {
    console.warn("⚠️ No hay destinatarios o contenido para WhatsApp");
    return 0;
  }

  // Estructura estética para el mensaje legal
  const fullMessage = `⚖️ *REPORTE DIARIO: ESTUDIO JURÍDICO*\n` +
                      `_Estado de plazos y tareas pendientes_\n\n` +
                      content +
                      `\n—\n🤖 _Enviado automáticamente por el Sistema VR_`;

  let sentCount = 0;
  for (const to of recipients) {
    try {
      await twilioClient.messages.create({
        body: fullMessage,
        // En el Sandbox usa el número que te dio Twilio. En producción usa el tuyo.
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`,
        to: `whatsapp:${to}`,
      });
      console.log(`📱 WhatsApp enviado a ${to}`);
      sentCount++;
    } catch (err: any) {
      console.error(`❌ Error al enviar WhatsApp a ${to}:`, err.message);
    }
  }
  return sentCount;
}

// === 4. CRON JOB PRINCIPAL ===
export async function GET() {
  try {
    const ahoraDate = new Date();
    const LIMITE_3_DIAS_MS = 2 * 24 * 60 * 60 * 1000;
    const tiempoAhora = ahoraDate.getTime();
    const tiempoLimite = tiempoAhora + LIMITE_3_DIAS_MS;

    let totalPush = 0;
    let whatsappBuffer = ""; // Acumulador de texto para el resumen

    // --- A. PROCESAR CASOS (PLAZOS, OFICIOS, TAREAS) ---
    const casesSnapshot = await db.collection('cases').get();

    for (const caseDoc of casesSnapshot.docs) {
      const caso = caseDoc.data();
      const expediente = caso.expediente || 'S/N';

      // 1. PLAZOS
      const plazos = caso.plazos || [];
      for (const plazo of plazos) {
        if (plazo.fecha) {
          const fechaPlazo = new Date(plazo.fecha);
          if (fechaPlazo.getTime() <= tiempoLimite && fechaPlazo.getTime() >= (tiempoAhora - 86400000)) {
            const fechaFmt = formatDate(plazo.fecha);
            const body = `${plazo.nombre || 'Vencimiento'} (${fechaFmt}) - Exp: ${expediente}`;

            // Acumular para WhatsApp
            whatsappBuffer += `🔴 *PLAZO:* ${body}\n`;

            // Notificación Push
            await beamsClient.publishToInterests(["hello"], {
              web: { 
                notification: { 
                  title: '🔴 PLAZO PRÓXIMO', 
                  body, 
                  icon: 'https://estudio-juridico-vr.vercel.app/balanza.jpg' 
                }
              }
            });
            totalPush++;
          }
        }
      }

      // 2. OFICIOS
      const oficios = caso.oficios || [];
      for (const oficio of oficios) {
        if (!oficio.completado && !oficio.entregado) {
          const body = `${oficio.titulo || 'Oficio'} - Exp: ${expediente}`;
          
          whatsappBuffer += `📂 *OFICIO:* ${body}\n`;

          await beamsClient.publishToInterests(["hello"], {
            web: { 
              notification: { 
                title: '📂 OFICIO PENDIENTE', 
                body, 
                icon: 'https://estudio-juridico-vr.vercel.app/balanza.jpg' 
              }
            }
          });
          totalPush++;
        }
      }

      // 3. TAREAS
      const tareas = caso.tareas || [];
      for (const tarea of tareas) {
        if (!tarea.completado && !tarea.entregado) {
          const body = `${tarea.titulo || 'Tarea'} - Exp: ${expediente}`;
          
          whatsappBuffer += `✅ *TAREA:* ${body}\n`;

          await beamsClient.publishToInterests(["hello"], {
            web: { 
              notification: { 
                title: '✅ TAREA PENDIENTE', 
                body, 
                icon: 'https://estudio-juridico-vr.vercel.app/balanza.jpg' 
              }
            }
          });
          totalPush++;
        }
      }
    }

    // --- B. EVENTOS DE AGENDA ---
    const eventsSnapshot = await db.collection('events').get();
    for (const eventDoc of eventsSnapshot.docs) {
      const evento = eventDoc.data();
      if (evento.fecha) {
        const fechaEv = new Date(evento.fecha);
        if (fechaEv.getTime() <= tiempoLimite && fechaEv.getTime() >= (tiempoAhora - 86400000)) {
          const fechaFmt = formatDate(evento.fecha);
          const body = `${evento.titulo || 'Sin título'} (Fecha: ${fechaFmt})`;

          whatsappBuffer += `📅 *AGENDA:* ${body}\n`;

          await beamsClient.publishToInterests(["hello"], {
            web: { 
              notification: { 
                title: '📅 EVENTO EN AGENDA', 
                body, 
                icon: 'https://estudio-juridico-vr.vercel.app/balanza.jpg' 
              }
            }
          });
          totalPush++;
        }
      }
    }

    // --- C. ENVÍO FINAL DE WHATSAPP ---
    let totalWa = 0;
    if (whatsappBuffer !== "") {
      totalWa = await sendWhatsAppSummary(whatsappBuffer);
    } else {
      console.log("ℹ️ Nada pendiente para enviar hoy.");
    }

    console.log(`📧 Push: ${totalPush} | 📱 WhatsApp: ${totalWa}`);
    return NextResponse.json({ success: true, push: totalPush, whatsapp: totalWa });

  } catch (error: any) {
    console.error("💥 Error en cron:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}