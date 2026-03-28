import webpush from 'web-push'

const globalForWebPush = globalThis as unknown as {
  webPushConfigured: boolean | undefined
}

if (!globalForWebPush.webPushConfigured) {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT

  if (publicKey && privateKey && subject) {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    globalForWebPush.webPushConfigured = true
  }
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: string
) {
  return webpush.sendNotification(subscription, payload)
}
