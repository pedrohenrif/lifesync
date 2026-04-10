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
import { Link } from "react-router-dom";
import { ArrowRight, Coins, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AuthUser } from "../../stores/authStore";
import { createPersonalReward, redeemPersonalReward } from "../../api/auth";

const CARD =
  "rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:p-5";

type GamificationCockpitProps = {
  readonly user: AuthUser;
};

export function LevelProgressBar({
  user,
  variant = "default",
}: {
  readonly user: AuthUser;
  readonly variant?: "default" | "large";
}): ReactElement {
  const pct =
    user.xpToNextLevel > 0
      ? Math.min(100, Math.round((user.currentXp / user.xpToNextLevel) * 100))
      : 100;

  const large = variant === "large";

  return (
    <div className={`${CARD} ${large ? "p-5 md:p-7" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Nível atual</p>
          <p
            className={`mt-1 font-bold tabular-nums tracking-tight text-zinc-100 ${large ? "text-4xl md:text-5xl" : "text-lg font-semibold"}`}
          >
            {user.level}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] ${large ? "px-4 py-2.5" : "px-2.5 py-1.5"}`}
        >
          <Coins className={`shrink-0 text-amber-500/90 ${large ? "h-5 w-5" : "h-3.5 w-3.5"}`} />
          <div className="text-left">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Moedas</p>
            <p className={`font-semibold tabular-nums text-zinc-100 ${large ? "text-lg" : "text-sm"}`}>
              {user.coins}
            </p>
          </div>
        </div>
      </div>
      <div
        className={`mt-4 flex items-center justify-between text-zinc-500 ${large ? "text-sm" : "text-[11px]"}`}
      >
        <span>Experiência até o próximo nível</span>
        <span className="tabular-nums text-zinc-400">
          {user.currentXp} / {user.xpToNextLevel} XP
        </span>
      </div>
      <div className={`mt-2 overflow-hidden rounded-full bg-zinc-800 ${large ? "h-3 md:h-3.5" : "h-2"}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {large ? (
        <p className="mt-4 text-xs text-zinc-600">
          XP total acumulado: <span className="tabular-nums text-zinc-500">{user.totalXp}</span>
        </p>
      ) : null}
    </div>
  );
}

export function EvolutionRadar({
  user,
  variant = "default",
}: {
  readonly user: AuthUser;
  readonly variant?: "default" | "large";
}): ReactElement {
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

  const large = variant === "large";
  const chartMin = large ? "min-h-[300px] lg:min-h-[380px]" : "min-h-[220px]";
  const outer = large ? "78%" : "70%";
  const tickSize = large ? 12 : 10;
  const strokeW = large ? 2 : 1.5;
  const fillOp = large ? 0.28 : 0.22;

  return (
    <div className={`${CARD} flex ${large ? "min-h-[320px] lg:min-h-[420px]" : "min-h-[280px]"} flex-col`}>
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className={`text-emerald-500/80 ${large ? "h-5 w-5" : "h-4 w-4"}`} />
        <h2 className={`font-semibold text-zinc-300 ${large ? "text-base md:text-lg" : "text-sm"}`}>
          {large ? "Gráfico de atributos" : "Perfil de evolução"}
        </h2>
      </div>
      <p className={`mb-3 text-zinc-600 ${large ? "text-xs md:text-sm" : "text-[11px]"}`}>
        {large
          ? "Cada eixo reflete o XP acumulado na dimensão — hábitos, metas e finanças moldam o seu perfil."
          : "Distribuição de XP por dimensão — reflexo da sua prática recente."}
      </p>
      {large ? (
        <ul className="mb-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-5 sm:gap-1">
          {data.map((d) => (
            <li
              key={d.subject}
              className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-2 py-1.5 text-center"
            >
              <span className="block text-zinc-500">{d.subject}</span>
              <span className="font-semibold tabular-nums text-emerald-400/90">{d.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={`${chartMin} w-full flex-1`}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={outer} data={data}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#71717a", fontSize: tickSize }}
            />
            <Radar
              name="XP"
              dataKey="value"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={fillOp}
              strokeWidth={strokeW}
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
      <h2 className="text-sm font-semibold text-zinc-300">Loja de recompensas</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
        Crie recompensas pessoais e resgate-as com moedas. Cada 1 XP ganho rende 1 moeda.
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
          placeholder="Ex.: Assistir filme, descanso sem telas"
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
      <div className="space-y-4">
        <LevelProgressBar user={user} variant="default" />
        <EvolutionRadar user={user} variant="default" />
        <Link
          to="/profile"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 py-2.5 text-xs font-medium text-emerald-500/90 transition hover:border-emerald-800/60 hover:bg-zinc-900 hover:text-emerald-400"
        >
          Ficha de personagem e loja
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </>
  );
}
