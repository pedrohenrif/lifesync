import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { subscribePushOnServer } from "../../api/push";
import { isPushSupported, urlBase64ToUint8Array } from "../../lib/webPush";
import { useAuthStore } from "../../stores/authStore";

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const DISMISS_KEY = "lifesync:push-banner-dismissed";

export function PushNotificationPrompt(): ReactElement | null {
  const token = useAuthStore((s) => s.token);
  const vapidKey = typeof VAPID_PUBLIC === "string" && VAPID_PUBLIC.trim().length > 0 ? VAPID_PUBLIC.trim() : null;

  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registeringRef = useRef(false);

  const syncPermission = useCallback(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    syncPermission();
  }, [syncPermission]);

  const tryRegisterSubscription = useCallback(async (): Promise<void> => {
    if (token === null || vapidKey === null || !isPushSupported()) return;
    if (Notification.permission !== "granted") return;
    if (registeringRef.current) return;
    registeringRef.current = true;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (sub === null) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }
      const json = sub.toJSON();
      if (
        json.endpoint === undefined ||
        json.keys?.p256dh === undefined ||
        json.keys?.auth === undefined
      ) {
        return;
      }
      const ok = await subscribePushOnServer({
        endpoint: json.endpoint,
        expirationTime: json.expirationTime ?? null,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      if (!ok) {
        setError("Não foi possível salvar a assinatura no servidor.");
      }
    } catch {
      setError("Falha ao ativar notificações push.");
    } finally {
      registeringRef.current = false;
    }
  }, [token, vapidKey]);

  useEffect(() => {
    if (token === null || vapidKey === null) return;
    void tryRegisterSubscription();
  }, [token, vapidKey, permission, tryRegisterSubscription]);

  const onEnable = async (): Promise<void> => {
    setError(null);
    setBusy(true);
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p === "granted") {
        await tryRegisterSubscription();
      }
    } catch {
      setError("Permissão negada ou indisponível neste navegador.");
    } finally {
      setBusy(false);
    }
  };

  const onDismiss = (): void => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (token === null || vapidKey === null) return null;
  if (!isPushSupported()) return null;
  if (permission === "denied") return null;
  if (permission === "granted") return null;
  if (dismissed) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-900/50 bg-blue-950/40 px-4 py-3 ring-1 ring-blue-500/15">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
        <Bell className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-100">Lembretes na tela de bloqueio</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
          Ative notificações para receber um lembrete diário quando faltar hábito no dia — estilo LifeSync, sem spam.
        </p>
        {error !== null ? <p className="mt-2 text-xs text-red-400/90">{error}</p> : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onEnable()}
          className="mt-3 rounded-lg bg-blue-600/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? "Aguarde…" : "Permitir notificações"}
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
        aria-label="Dispensar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
