import type { GoalCategory } from "../../domain/entities/Goal.js";

export class HttpGamificationNotifier {
  constructor(
    private readonly authServiceBaseUrl: string,
    private readonly internalKey: string,
  ) {}

  async notifyGoalTaskComplete(userId: string, goalCategory: GoalCategory): Promise<void> {
    await this.post({
      type: "goal_task_complete",
      userId,
      goalCategory,
    });
  }

  async notifyGoalCompleted(userId: string, goalCategory: GoalCategory): Promise<void> {
    await this.post({
      type: "goal_completed",
      userId,
      goalCategory,
    });
  }

  private async post(body: Record<string, unknown>): Promise<void> {
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
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.warn(`[goals] gamification notify failed ${res.status} ${t}`);
      }
    } catch (e) {
      console.warn("[goals] gamification notify error", e);
    }
  }
}
