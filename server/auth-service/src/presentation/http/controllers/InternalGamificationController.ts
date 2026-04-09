import type { Request, Response } from "express";
import { z } from "zod";
import type { ApplyInternalGamificationEventUseCase } from "../../../application/use-cases/ApplyInternalGamificationEventUseCase.js";

const habitCategory = z.enum(["SAUDE", "FOCO", "FINANCAS", "PESSOAL"]);
const goalCategory = z.enum(["STUDY", "PERSONAL", "BUSINESS", "FAMILY", "DREAMS", "OTHER"]);

const eventBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("habit_checkin"),
    userId: z.string().min(1),
    habitCategory: habitCategory,
  }),
  z.object({
    type: z.literal("goal_task_complete"),
    userId: z.string().min(1),
    goalCategory: goalCategory,
  }),
  z.object({
    type: z.literal("goal_completed"),
    userId: z.string().min(1),
    goalCategory: goalCategory,
  }),
]);

export class InternalGamificationController {
  constructor(private readonly applyEvent: ApplyInternalGamificationEventUseCase) {}

  async postEvent(req: Request, res: Response): Promise<void> {
    const parsed = eventBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "INVALID_BODY",
          issues: parsed.error.flatten(),
        },
      });
      return;
    }

    const result = await this.applyEvent.execute(parsed.data);
    if (!result.ok) {
      if (result.error.code === "USER_NOT_FOUND") {
        res.status(404).json({ error: result.error });
        return;
      }
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(200).json(result.value);
  }
}
