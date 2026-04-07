import type { ReactElement } from "react";

const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"] as const;

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDays(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

type WeeklyTrackerProps = {
  readonly completedDates: readonly string[];
};

export function WeeklyTracker({ completedDates }: WeeklyTrackerProps): ReactElement {
  const weekDays = getWeekDays();
  const todayKey = toDateKey(new Date());
  const completedSet = new Set(completedDates);

  return (
    <div className="flex items-center gap-1.5">
      {weekDays.map((day, i) => {
        const key = toDateKey(day);
        const isCompleted = completedSet.has(key);
        const isToday = key === todayKey;

        return (
          <div key={key} className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-medium text-zinc-600">
              {DAY_LABELS[i]}
            </span>
            <div
              className={`h-5 w-5 rounded-full transition ${
                isCompleted
                  ? "bg-orange-500"
                  : isToday
                    ? "border-2 border-zinc-500"
                    : "border border-zinc-700"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
