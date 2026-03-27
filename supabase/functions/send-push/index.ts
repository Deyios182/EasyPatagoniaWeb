import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webPush from 'https://esm.sh/web-push@3.6.4'

// Set VAPID keys provided via environment variables in Supabase
const VAPID_MAILTO = Deno.env.get('VAPID_MAILTO') || 'mailto:admin@easypatagonia.com'
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

serve(async (req) => {
  try {
    // Solo permitir POST
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

    // Payload de Webhook de Base de Datos de Supabase (esperamos que se haya ejecutado en un INSERT a 'notifications')
    const payload = await req.json()
    const record = payload.record // La nueva fila en tabla notifications

    if (!record || !record.user_id || !record.message) {
      return new Response('Invalid payload', { status: 400 })
    }

    // Inicializar cliente Supabase para buscar el endpoint de este usuario
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar la suscripción del usuario destino
    const { data: subs, error } = await supabaseClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', record.user_id)

    if (error || !subs || subs.length === 0) {
      return new Response('El usuario no tiene suscripción a web push', { status: 200 })
    }

    // Preparar mensaje de notificación visual
    const notificationPayload = JSON.stringify({
      title: record.type === 'message' ? 'Nuevo Mensaje' : 'Easy Patagonia',
      body: record.message,
      icon: 'https://vymllfbbhghwndpysqem.supabase.co/storage/v1/object/public/assets/logo.png', // puedes cambiarlo
      url: record.type === 'message' && record.actor_id ? `/messages/${record.actor_id}` : '/community'
    })

    // Enviar la notificación a todos los dispositivos del usuario
    const results = await Promise.all(subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }

      try {
        await webPush.sendNotification(pushSubscription, notificationPayload)
        return { success: true, endpoint: sub.endpoint }
      } catch (err: any) {
        // Log it, if status code is 410, the subscription has expired or unsubscribed
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Eliminar limpieza
          await supabaseClient.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        return { success: false, endpoint: sub.endpoint, error: err.message }
      }
    }))

    return new Response(JSON.stringify({ sent: true, results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
