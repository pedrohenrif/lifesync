import { z } from "zod";
import type { IUserRepository, StoredPushSubscription } from "../../domain/repositories/IUserRepository.js";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const bodySchema = z.object({
  subscription: subscriptionSchema,
});

export type SubscribePushInput = z.infer<typeof bodySchema>;

export class SubscribePushUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    userId: string,
    body: unknown,
  ): Promise<
    | { readonly ok: true }
    | { readonly ok: false; readonly code: "INVALID_BODY" | "USER_NOT_FOUND"; readonly issues?: unknown }
  > {
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, code: "INVALID_BODY", issues: parsed.error.flatten() };
    }

    const user = await this.userRepository.findById(userId);
    if (user === null) {
      return { ok: false, code: "USER_NOT_FOUND" };
    }

    const s = parsed.data.subscription;
    const sub: StoredPushSubscription = {
      endpoint: s.endpoint,
      expirationTime: s.expirationTime ?? null,
      keys: { p256dh: s.keys.p256dh, auth: s.keys.auth },
    };

    await this.userRepository.upsertPushSubscription(userId, sub);
    return { ok: true };
  }
}
