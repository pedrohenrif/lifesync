import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Confetti from "react-confetti";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Coins, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AuthUser } from "../../stores/authStore";
import { createPersonalReward, redeemPersonalReward } from "../../api/auth";

const CARD =
  "rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:p-5";

type GamificationCockpitProps = {
  readonly user: AuthUser;
};

export function LevelProgressBar({ user }: { readonly user: AuthUser }): ReactElement {
  const pct =
    user.xpToNextLevel > 0
      ? Math.min(100, Math.round((user.currentXp / user.xpToNextLevel) * 100))
      : 100;

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Nível
          </span>
          <span className="text-lg font-semibold tabular-nums text-zinc-100">{user.level}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Coins className="h-3.5 w-3.5 text-amber-500/90" />
          <span className="tabular-nums text-zinc-300">{user.coins}</span>
          <span className="text-zinc-600">moedas</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
        <span>Progresso de maestria</span>
        <span className="tabular-nums">
          {user.currentXp} / {user.xpToNextLevel} XP
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function EvolutionRadar({ user }: { readonly user: AuthUser }): ReactElement {
  const data = useMemo(() => {
    const a = user.attributes;
    const max = Math.max(1, ...Object.values(a));
    return [
      { subject: "Saúde", value: a.health, fullMark: max },
      { subject: "Finanças", value: a.finance, fullMark: max },
      { subject: "Foco", value: a.focus, fullMark: max },
      { subject: "Conhecimento", value: a.knowledge, fullMark: max },
      { subject: "Social", value: a.social, fullMark: max },
    ];
  }, [user.attributes]);

  return (
    <div className={`${CARD} flex min-h-[280px] flex-col`}>
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-500/80" />
        <h2 className="text-sm font-semibold text-zinc-300">Perfil de evolução</h2>
      </div>
      <p className="mb-2 text-[11px] text-zinc-600">
        Distribuição de XP por dimensão — reflexo da sua prática recente.
      </p>
      <div className="min-h-[220px] flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#71717a", fontSize: 10 }}
            />
            <Radar
              name="XP"
              dataKey="value"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.22}
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PersonalRewardsPanel({ user }: { readonly user: AuthUser }): ReactElement {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      createPersonalReward({
        title: title.trim(),
        costCoins: Number.parseInt(cost, 10),
      }),
    onSuccess: () => {
      setTitle("");
      setCost("");
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Recompensa registrada.");
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const redeemMut = useMutation({
    mutationFn: (id: string) => redeemPersonalReward(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Resgate registrado. Aproveite o momento.");
    },
    onError: () => toast.error("Saldo insuficiente ou erro ao resgatar."),
  });

  return (
    <div className={CARD}>
      <h2 className="text-sm font-semibold text-zinc-300">Loja pessoal</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
        Defina conquistas que deseja desbloquear. Cada 1 XP ganho rende 1 moeda.
      </p>

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const c = Number.parseInt(cost, 10);
          if (title.trim().length === 0 || Number.isNaN(c) || c < 1) return;
          createMut.mutate();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Cinema, descanso, equipamento"
          className="min-h-10 flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-700/50"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Custo"
            className="w-24 min-h-10 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-700/50"
          />
          <button
            type="submit"
            disabled={createMut.isPending}
            className="min-h-10 shrink-0 rounded-lg bg-emerald-600/90 px-3 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </form>

      <ul className="mt-4 space-y-2">
        {user.personalRewards.length === 0 ? (
          <li className="text-xs text-zinc-600">Nenhuma recompensa cadastrada.</li>
        ) : (
          user.personalRewards.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm text-zinc-200">{r.title}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs tabular-nums text-amber-500/90">{r.costCoins} mc</span>
                <button
                  type="button"
                  disabled={redeemMut.isPending || user.coins < r.costCoins}
                  onClick={() => redeemMut.mutate(r.id)}
                  className="rounded-md border border-zinc-700 px-2 py-1 text-[10px] font-medium text-zinc-300 transition hover:border-emerald-600/50 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Resgatar
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function LevelUpOverlay(): ReactElement | null {
  const [dims, setDims] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useEffect(() => {
    const onResize = (): void => {
      setDims({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (dims.width === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[110] flex flex-col items-center justify-start pt-[20vh]">
      <Confetti
        width={dims.width}
        height={dims.height}
        recycle={false}
        numberOfPieces={320}
        gravity={0.1}
        colors={["#10b981", "#34d399", "#6ee7b7", "#d1fae5", "#e4e4e7"]}
      />
      <p className="relative z-[111] text-center text-lg font-semibold tracking-tight text-emerald-400 drop-shadow-lg">
        NÍVEL AUMENTADO!
      </p>
    </div>
  );
}

export function GamificationCockpit({ user }: GamificationCockpitProps): ReactElement {
  const prevLevelRef = useRef<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    const L = user.level;
    const prev = prevLevelRef.current;
    if (prev !== null && L > prev) {
      setShowLevelUp(true);
      const t = window.setTimeout(() => setShowLevelUp(false), 4200);
      prevLevelRef.current = L;
      return () => window.clearTimeout(t);
    }
    prevLevelRef.current = L;
  }, [user.level]);

  return (
    <>
      {showLevelUp ? <LevelUpOverlay /> : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <LevelProgressBar user={user} />
        </div>
        <div className="lg:col-span-2">
          <EvolutionRadar user={user} />
        </div>
        <div className="lg:col-span-3">
          <PersonalRewardsPanel user={user} />
        </div>
      </div>
    </>
  );
}
