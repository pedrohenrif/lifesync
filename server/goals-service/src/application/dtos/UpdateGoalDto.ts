export type UpdateGoalDto = {
  readonly title?: string;
  readonly description?: string | null;
  readonly status?: string;
  readonly category?: string;
  readonly targetDate?: string | null;
};
