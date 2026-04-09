import { useCallback, useEffect, useState } from "react";

/** Evento não tipado no TypeScript padrão; usado pelo Chrome/Edge para PWA. */
type BeforeInstallPromptEvent = Event & {
  readonly prompt: () => Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: "accepted" | "dismissed" }>;
};

function isRunningAsInstalledApp(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { readonly standalone?: boolean };
  return nav.standalone === true;
}

export function usePwaInstall(): {
  readonly canShowInstall: boolean;
  readonly install: () => Promise<void>;
} {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isRunningAsInstalledApp()) return;

    const handler = (e: Event): void => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async () => {
    if (deferred === null) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);

  return {
    canShowInstall: deferred !== null,
    install,
  };
}
