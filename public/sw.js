// service-worker para recibir notificaciones Web Push

self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const title = data.title || 'Easy Patagonia';
            const options = {
                body: data.body || 'Tienes una nueva notificación.',
                icon: data.icon || '/icon-192x192.png', // Icono de tu app si tienes
                badge: data.badge || '/badge.png', // Opcional
                data: data.url || '/' // El link a abrir al clickear
            };

            event.waitUntil(self.registration.showNotification(title, options));
        } catch (e) {
            console.error('Error parseando JSON de push', e);
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Revisa si ya hay una ventana abierta con la app e intenta enfocarla
            const urlToOpen = event.notification.data || '/';
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Si no hay ventana, abre una nueva
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
