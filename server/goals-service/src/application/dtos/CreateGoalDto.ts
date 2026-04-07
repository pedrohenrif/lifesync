export type CreateGoalDto = {
  readonly title: string;
  readonly description?: string;
  readonly category: string;
  readonly targetDate?: string;
};
