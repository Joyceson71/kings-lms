export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  const sw = await navigator.serviceWorker.ready;
  const existing = await sw.pushManager.getSubscription();
  if (existing) return existing;

  try {
    const sub = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      )
    });

    await fetch('/api/iv/push-subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription: sub.toJSON() }),
      headers: { 'Content-Type': 'application/json' }
    });

    return sub;
  } catch (err) {
    console.warn('Push subscription failed:', err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
