import type { HabitCategory } from "../../domain/entities/Habit.js";

export class HttpGamificationNotifier {
  constructor(
    private readonly authServiceBaseUrl: string,
    private readonly internalKey: string,
  ) {}

  async notifyHabitCheckin(userId: string, habitCategory: HabitCategory): Promise<void> {
    if (this.authServiceBaseUrl.length === 0 || this.internalKey.length === 0) {
      return;
    }
    const base = this.authServiceBaseUrl.replace(/\/$/, "");
    const url = `${base}/auth/internal/gamification/events`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": this.internalKey,
        },
        body: JSON.stringify({
          type: "habit_checkin",
          userId,
          habitCategory,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.warn(`[habits] gamification notify failed ${res.status} ${t}`);
      }
    } catch (e) {
      console.warn("[habits] gamification notify error", e);
    }
  }
}
