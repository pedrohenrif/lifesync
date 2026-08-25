import type { PrimaryFocus, User, UserStatus } from "../entities/User.js";
import type { Paginated, PaginationParams } from "../pagination.js";

/** Assinatura Web Push (formato compatível com `web-push` / Push API). */
export type StoredPushSubscription = {
  readonly endpoint: string;
  readonly expirationTime: number | null;
  readonly keys: { readonly p256dh: string; readonly auth: string };
};

export interface IUserRepository {
  save(user: User): Promise<void>;
  updateUser(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByStatus(
    status: UserStatus,
    pagination: PaginationParams,
  ): Promise<Paginated<User>>;
  updateStatus(id: string, status: UserStatus): Promise<void>;
  completeOnboarding(
    id: string,
    input: { readonly name: string; readonly primaryFocus?: PrimaryFocus },
  ): Promise<User | null>;
  upsertPushSubscription(userId: string, subscription: StoredPushSubscription): Promise<void>;
  removePushSubscriptionByEndpoint(userId: string, endpoint: string): Promise<void>;
  findPushSubscriptionsForUserIds(
    userIds: readonly string[],
  ): Promise<Map<string, StoredPushSubscription[]>>;
}
