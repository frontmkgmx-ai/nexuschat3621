import { getToken, onMessage } from "firebase/messaging";
import { messagingPromise, db } from "../lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { soundService } from "./soundService";

const VAPID_KEY = "BCIEwVGuQYQOcDjNqs5C0SEyUKEbSq5yXL0AtnByf_7bLqQIMh-HfQ-atmzBaz-LrIg2ERa9kdq5fRUK9D0wH_M";

export async function requestNotificationPermission(userId?: string) {
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações de desktop");
    return false;
  }

  let permission = Notification.permission;

  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission === 'granted') {
    const messaging = await messagingPromise;
    if (messaging) {
       try {
           const token = await getToken(messaging, { vapidKey: VAPID_KEY });
           if (token && userId) {
             // Saving token to the user document
             await updateDoc(doc(db, "users", userId), {
                fcmTokens: arrayUnion(token)
             });
             console.log("FCM Token registrado.");
           }
       } catch (err) {
           console.error("Falha ao pegar token FCM:", err);
       }
    }
  }

  return permission === 'granted';
}

export async function setupForegroundMessages() {
   const messaging = await messagingPromise;
   if (messaging) {
      onMessage(messaging, (payload) => {
         // Show local notification
         if (payload.notification) {
            new Notification(payload.notification.title || "Nova Notificação", {
               body: payload.notification.body,
               icon: '/icon.png' // fallback icon
            });
            // Play notification sound
            soundService.playReceive();
         }
      });
   }
}

// Emits browser notification
export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, options);
  }
}
