import type { ReactElement } from "react";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import {
  EvolutionRadar,
  LevelProgressBar,
  PersonalRewardsPanel,
} from "../components/gamification/GamificationCockpit";

export function Profile(): ReactElement {
  const user = useAuthStore((s) => s.user);

  if (user === null) {
    return (
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-zinc-500">Carregando perfil…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-500/90" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">Ficha de personagem</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Seu nível, XP, moedas e atributos em um só lugar. Gerencie a loja de recompensas e troque esforço por momentos que
          importam para você.
        </p>
      </div>

      <section aria-labelledby="profile-status-heading">
        <h2 id="profile-status-heading" className="sr-only">
          Status e progresso
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-5">
            <LevelProgressBar user={user} variant="large" />
          </div>
          <div className="lg:col-span-7">
            <EvolutionRadar user={user} variant="large" />
          </div>
        </div>
      </section>

      <section aria-label="Loja de recompensas pessoais">
        <PersonalRewardsPanel user={user} />
      </section>
    </div>
  );
}
