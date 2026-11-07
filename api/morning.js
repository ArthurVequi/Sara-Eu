import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { timingSafeEqual } from 'node:crypto'

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  const expected = Buffer.from(`Bearer ${secret}`)
  const supplied = Buffer.from(req.headers.authorization ?? '')
  if (req.method !== 'GET' || !secret || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return res.status(401).end()
  }
  try {
    const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await client.from('organiza_push').select('endpoint, subscription, user_id')
    if (error) throw error
    webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VITE_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
    const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
    const payload = JSON.stringify({ title: 'Seus compromissos de hoje', body: 'Toque para abrir a agenda do dia.', url: `/?agenda=${day}` })
    const results = await Promise.allSettled(data.map(async row => {
      try {
        await webpush.sendNotification(row.subscription, payload, { TTL: 3600, topic: day })
      } catch (failure) {
        if (failure.statusCode !== 404 && failure.statusCode !== 410) throw failure
        const { error: cleanup } = await client.from('organiza_push').delete().eq('endpoint', row.endpoint)
        if (cleanup) throw cleanup
      }
    }))
    const failures = results.filter(result => result.status === 'rejected').length
    return res.status(failures ? 502 : 200).json({ subscriptions: data.length, failures })
  } catch {
    return res.status(500).json({ error: 'Falha no envio do lembrete' })
  }
}
