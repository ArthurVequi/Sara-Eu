/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = import.meta.env
export const cloud = VITE_SUPABASE_URL && VITE_SUPABASE_PUBLISHABLE_KEY
  ? createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  : null

export async function enableMorningPush() {
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!cloud || !publicKey || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Lembretes indisponíveis. No iPhone, abra o app pela tela de início.')
  }
  if (await Notification.requestPermission() !== 'granted') throw new Error('Permissão para notificações não concedida.')
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration?.active) throw new Error('Reabra o app para concluir a instalação dos lembretes.')
  const key = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(publicKey.length / 4) * 4, '=')), character => character.charCodeAt(0))
  const subscription = await registration.pushManager.getSubscription()
    ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
  const response = await fetch('/api/push-subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  })
  if (!response.ok) throw new Error('Não foi possível registrar este aparelho para lembretes.')
}
