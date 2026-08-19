import { apiRequest } from "./client";

export type PushSubscriptionPayload = {
  readonly endpoint: string;
  readonly expirationTime: number | null;
  readonly keys: { readonly p256dh: string; readonly auth: string };
};

export async function subscribePushOnServer(subscription: PushSubscriptionPayload): Promise<boolean> {
  const res = await apiRequest("/auth/push/subscribe", {
    method: "POST",
    body: { subscription },
  });
  return res.status === 204;
}
