import type { Request, Response } from "express";
import type { ListUserIdsWithPendingHabitsTodayUseCase } from "../../../application/use-cases/ListUserIdsWithPendingHabitsTodayUseCase.js";

export class InternalHabitsController {
  constructor(private readonly listPendingUserIdsUseCase: ListUserIdsWithPendingHabitsTodayUseCase) {}

  async listUsersPendingToday(_req: Request, res: Response): Promise<void> {
    const userIds = await this.listPendingUserIdsUseCase.execute();
    res.status(200).json({ userIds });
  }
}
