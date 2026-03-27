import { supabase } from '../supabaseClient';

// Debes reemplazar esta clave con tu PUBLIC_VAPID_KEY generada
// Para generar claves usa `npx web-push generate-vapid-keys`
export const PUBLIC_VAPID_KEY = 'BEMF9jYGv8aurPmo1-KhaZ9U5XBgrthx8kTz2ckg5CPMevwt5yZc1Ic9lMiQ_NS2-xVbdEmTIY9UL6N3HsLfHUU';

/**
 * Convierte urlBase64 a un Uint8Array requerido por el Browser
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const subscribeToPushNotifications = async (userId: string) => {
    if (!isPushSupported()) {
        throw new Error('Push notifications no están soportadas en este navegador.');
    }

    // The PUBLIC_VAPID_KEY is already set to the desired value,
    // so the check for 'REPLACE_WITH_YOUR_PUBLIC_VAPID_KEY' is no longer relevant.
    // The instruction implies setting the key, which is already done globally.
    // The provided "Code Edit" snippet for this section was syntactically incorrect.
    // Assuming the intent was to ensure the key is set and remove the placeholder check if it's now set.

    // 1. Pedir permiso
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Permiso de notificación denegado.');
    }

    // 2. Registrar Service Worker
    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // 3. Suscribirse a Push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        const subJSON = subscription.toJSON();

        // 4. Guardar en Supabase
        const { error } = await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: subJSON.endpoint,
            p256dh: subJSON.keys?.p256dh,
            auth: subJSON.keys?.auth
        }, { onConflict: 'endpoint' });

        if (error) {
            console.error('Error guardando push_subscription:', error);
            throw new Error('Error al guardar en base de datos.');
        }

        return true;
    } catch (e) {
        console.error('Error suscribiendo a push:', e);
        throw e;
    }
};

export const checkPushStatus = async (): Promise<boolean> => {
    if (!isPushSupported()) return false;
    if (Notification.permission !== 'granted') return false;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
};
