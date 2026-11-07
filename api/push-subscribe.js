import { createClient } from '@supabase/supabase-js'

const providers = new Set([
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
  'wns2-par02p.notify.windows.com',
])

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { endpoint, keys } = req.body ?? {}
  if (typeof endpoint !== 'string' || endpoint.length > 2048 ||
      typeof keys?.p256dh !== 'string' || !/^[\w-]{87}$/.test(keys.p256dh) ||
      typeof keys?.auth !== 'string' || !/^[\w-]{22}$/.test(keys.auth)) return res.status(400).end()
  let url
  try {
    url = new URL(endpoint)
  } catch {
    return res.status(400).end()
  }
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !providers.has(url.hostname)) return res.status(400).end()
  const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { error } = await client.from('organiza_push').upsert({
    endpoint: url.href,
    subscription: { endpoint: url.href, keys: { p256dh: keys.p256dh, auth: keys.auth } },
  }, { onConflict: 'endpoint', ignoreDuplicates: true })
  return res.status(error ? 502 : 204).end()
}
