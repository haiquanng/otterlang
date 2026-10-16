import { z } from 'zod'
import { request } from '@/lib/http'

export type PushSupport = 'supported' | 'unsupported' | 'install-first'

/** No service worker: the dev server, or a browser that blocked it. */
export class NoServiceWorkerError extends Error {}

async function registration(): Promise<ServiceWorkerRegistration> {
  // Not `serviceWorker.ready`: in `npm run dev` there is no worker and it would wait forever.
  const found = await navigator.serviceWorker.getRegistration()
  if (!found) throw new NoServiceWorkerError()
  return found
}

/** VAPID keys are base64url; the Push API wants raw bytes. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/**
 * iPhone and iPad only allow web push for apps added to the Home Screen
 * and opened from there (iOS 16.4+). Elsewhere it depends on the browser APIs.
 */
export function pushSupport(userAgent: string, standalone: boolean, hasApis: boolean): PushSupport {
  const ios = /iPhone|iPad|iPod/.test(userAgent)
  if (ios && !standalone) return 'install-first'
  return hasApis ? 'supported' : 'unsupported'
}

export function currentPushSupport(): PushSupport {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  const hasApis = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  return pushSupport(navigator.userAgent, standalone, hasApis)
}

export async function subscribeThisDevice(): Promise<void> {
  const { key } = await request('/push/public-key', z.object({ key: z.string() }), { retryOn401: false })
  const worker = await registration()
  const subscription =
    (await worker.pushManager.getSubscription()) ??
    (await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }))
  const json = subscription.toJSON()
  await request('/push/subscription', z.undefined(), {
    method: 'PUT',
    body: { endpoint: json.endpoint, keys: json.keys },
  })
}

export async function unsubscribeThisDevice(): Promise<void> {
  const worker = await navigator.serviceWorker.getRegistration()
  const subscription = await worker?.pushManager.getSubscription()
  if (!subscription) return
  await request('/push/subscription/remove', z.undefined(), {
    method: 'POST',
    body: { endpoint: subscription.endpoint },
  })
  await subscription.unsubscribe()
}

const testResultSchema = z.object({ sent: z.number(), expired: z.number(), failed: z.number() })

/** Re-registers this device first, so the test also repairs a subscription the server lost. */
export async function sendTestNotification(): Promise<z.infer<typeof testResultSchema>> {
  await subscribeThisDevice()
  return request('/push/test', testResultSchema, { method: 'POST' })
}
