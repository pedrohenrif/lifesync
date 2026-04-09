/** 100 XP por nível; nível 1 com 0 XP total. */
const XP_PER_LEVEL = 100;

export type LevelProgress = {
  readonly level: number;
  readonly currentXp: number;
  readonly xpToNextLevel: number;
  readonly totalXp: number;
};

export function computeLevelProgress(totalXp: number): LevelProgress {
  const safe = Math.max(0, Math.floor(totalXp));
  const level = Math.floor(safe / XP_PER_LEVEL) + 1;
  const currentXp = safe % XP_PER_LEVEL;
  return {
    level,
    currentXp,
    xpToNextLevel: XP_PER_LEVEL,
    totalXp: safe,
  };
}
