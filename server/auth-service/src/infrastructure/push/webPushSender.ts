import webpush from "web-push";
import type { StoredPushSubscription } from "../../domain/repositories/IUserRepository.js";

export type PushPayload = {
  readonly title: string;
  readonly body: string;
  readonly url?: string;
};

export function configureWebPush(publicKey: string, privateKey: string, subject: string): void {
  webpush.setVapidDetails(subject.trim(), publicKey.trim(), privateKey.trim());
}

export async function sendPushToSubscription(
  sub: StoredPushSubscription,
  payload: PushPayload,
): Promise<{ readonly ok: true } | { readonly ok: false; readonly statusCode?: number }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime ?? undefined,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      },
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (err: unknown) {
    const statusCode =
      typeof err === "object" && err !== null && "statusCode" in err
        ? Number((err as { statusCode: number }).statusCode)
        : undefined;
    return { ok: false, statusCode };
  }
}
