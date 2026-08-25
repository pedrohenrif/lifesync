import cron from "node-cron";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { sendPushToSubscription } from "../push/webPushSender.js";

const BODIES: readonly string[] = [
  "Ei, seu escudo está acabando! Faltam hábitos para completar hoje.",
  "O Boss está esperando! Complete suas metas.",
  "Sua ofensiva precisa de você — ainda há hábitos no radar hoje.",
  "Um check agora mantém o ritmo. Abra o LifeSync e feche o dia.",
];

export type EveningHabitPushCronDeps = {
  readonly enabled: boolean;
  readonly userRepository: IUserRepository;
  readonly habitsServiceUrl: string;
  readonly internalKey: string;
  readonly vapidConfigured: boolean;
};

async function fetchPendingUserIds(baseUrl: string, internalKey: string): Promise<readonly string[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/habits/internal/users-pending-today`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "x-internal-key": internalKey },
  });
  if (!res.ok) {
    throw new Error(`habits internal users-pending-today failed: ${res.status}`);
  }
  const data = (await res.json()) as { userIds?: unknown };
  if (!Array.isArray(data.userIds)) return [];
  return data.userIds.filter((x): x is string => typeof x === "string" && x.length > 0);
}

export function startEveningHabitPushCron(deps: EveningHabitPushCronDeps): void {
  if (!deps.enabled) {
    console.log("[push-reminder] ENABLE_PUSH_REMINDER_CRON is not true — skipping schedule.");
    return;
  }
  if (!deps.vapidConfigured) {
    console.warn("[push-reminder] VAPID keys missing — skipping schedule.");
    return;
  }
  if (deps.internalKey.length === 0) {
    console.warn("[push-reminder] INTERNAL_GAMIFICATION_KEY empty — cannot call habits internal API.");
    return;
  }

  cron.schedule(
    "0 20 * * *",
    () => {
      void (async () => {
        try {
          const userIds = await fetchPendingUserIds(deps.habitsServiceUrl, deps.internalKey);
          const subsMap = await deps.userRepository.findPushSubscriptionsForUserIds(userIds);
          let sent = 0;
          for (const [uid, subs] of subsMap) {
            const body = BODIES[uid.length % BODIES.length] ?? BODIES[0];
            for (const sub of subs) {
              const r = await sendPushToSubscription(sub, {
                title: "LifeSync",
                body,
                url: "/habits",
              });
              if (!r.ok && r.statusCode === 410) {
                await deps.userRepository.removePushSubscriptionByEndpoint(uid, sub.endpoint);
              }
              if (r.ok) sent++;
            }
          }
          console.log(
            `[push-reminder] pendingUsers=${userIds.length} mapUsers=${subsMap.size} notificationsSent=${sent}`,
          );
        } catch (e) {
          console.error("[push-reminder] job error", e);
        }
      })();
    },
    { timezone: "America/Sao_Paulo" },
  );

  console.log("[push-reminder] cron scheduled: daily 20:00 (America/Sao_Paulo)");
}
