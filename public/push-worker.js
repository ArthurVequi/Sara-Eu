self.addEventListener('push', event => {
  const { title, body, url } = event.data?.json() ?? {}
  if (!title) return
  event.waitUntil(self.registration.showNotification(title, { body, data: { url }, tag: 'agenda-do-dia' }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = new URL(event.notification.data?.url ?? '/', self.location.origin)
  if (url.origin === self.location.origin) event.waitUntil(self.clients.openWindow(url.href))
})
