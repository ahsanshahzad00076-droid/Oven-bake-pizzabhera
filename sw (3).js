// ═══════════════════════════════════════════════════════════════
//  SERVICE WORKER — Oven Bake Pizza Bhera
//  File: sw.js  |  Isi folder mein rakhein jahan staff_panel hai
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'oven-bake-staff-v1';
const LOGO_URL = 'https://cdn.phototourl.com/free/2026-05-18-dc007e3d-8822-4995-a527-b247c54a17a2.png';

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  self.skipWaiting(); // Activate immediately
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activated!');
  event.waitUntil(clients.claim()); // Take control of all pages
});

// ── FETCH (offline cache — optional) ─────────────────────────
self.addEventListener('fetch', event => {
  // Pass through all requests normally
  // (Add caching logic here later if needed)
});

// ── PUSH NOTIFICATION (Firebase Cloud Messaging) ─────────────
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {
    data = { title: '🔔 Naya Order!', body: event.data ? event.data.text() : '' };
  }

  const title   = data.notification?.title || data.title || '🔔 Naya Order Aaya!';
  const body    = data.notification?.body  || data.body  || 'Oven Bake Pizza — Order check karein!';
  const orderId = data.data?.orderId || data.orderId || '';

  const options = {
    body,
    icon:  LOGO_URL,
    badge: LOGO_URL,
    vibrate: [500, 200, 500, 200, 500, 200, 800],
    requireInteraction: true,   // Notification screen par ruke — khud band na ho
    tag: 'order-' + (orderId || Date.now()),
    renotify: true,
    data: { url: self.location.origin + '/staff_panel_v4.html', orderId },
    actions: [
      { action: 'accept', title: '✅ Accept Karo' },
      { action: 'view',   title: '👀 Dekho'        }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Agar tab already khuli hai — focus karo
      for (const client of clientList) {
        if (client.url.includes('staff_panel') && 'focus' in client) {
          return client.focus();
        }
      }
      // Nahi to naya tab kholo
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── MESSAGE FROM PAGE (manual notification trigger) ───────────
// Staff panel background mein ho to page se message aata hai
self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, orderId } = event.data;
    self.registration.showNotification(title || '🔔 Naya Order!', {
      body:    body || 'App kholein aur order accept karein!',
      icon:    LOGO_URL,
      badge:   LOGO_URL,
      vibrate: [600, 200, 600, 200, 600],
      requireInteraction: true,
      tag:     'order-' + (orderId || Date.now()),
      renotify: true,
      actions: [
        { action: 'accept', title: '✅ Accept' },
        { action: 'open',   title: '📱 Kholo'  }
      ],
      data: { url: self.location.origin + '/staff_panel_v4.html', orderId }
    });
  }

  // Ping — SW alive hai check karne ke liye
  if (event.data.type === 'PING') {
    event.source?.postMessage({ type: 'PONG' });
  }
});
