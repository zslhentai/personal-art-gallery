import { useSyncExternalStore } from "react";
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let installPrompt: InstallPrompt | undefined;
let registration: ServiceWorkerRegistration | undefined;
let refreshing = false;
const subscribers = new Set<() => void>();
let state = {
  canInstall: false,
  installed: false,
  updateReady: false,
  offline: !navigator.onLine,
  unavailable: false,
};
const emit = (patch: Partial<typeof state>) => {
  state = { ...state, ...patch };
  subscribers.forEach((cb) => cb());
};
export function usePwa() {
  return useSyncExternalStore(
    (cb) => {
      subscribers.add(cb);
      return () => {
        subscribers.delete(cb);
      };
    },
    () => state,
  );
}
export function initPwa() {
  emit({
    installed:
      matchMedia("(display-mode: standalone)").matches ||
      !!(navigator as Navigator & { standalone?: boolean }).standalone,
  });
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as InstallPrompt;
    emit({ canInstall: true });
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = undefined;
    emit({ installed: true, canInstall: false });
  });
  window.addEventListener("online", () => {
    emit({ offline: false });
    void registration?.update().catch(() => {});
  });
  window.addEventListener("offline", () => emit({ offline: true }));
  if (!("serviceWorker" in navigator)) {
    emit({ unavailable: true });
    return;
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) {
      refreshing = false;
      location.reload();
    }
  });
  const register = () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
        updateViaCache: "none",
      })
      .then((reg) => {
        registration = reg;
        if (reg.waiting) emit({ updateReady: true });
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller &&
              reg.waiting
            )
              emit({ updateReady: true });
          });
        });
      })
      .catch(() => emit({ unavailable: true }));
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine)
      void registration?.update().catch(() => {});
  });
}
export function applyPwaUpdate() {
  if (!registration?.waiting) return;
  refreshing = true;
  registration.waiting.postMessage({ type: "SKIP_WAITING" });
}
export async function installPwa() {
  if (!installPrompt) return;
  const prompt = installPrompt;
  await prompt.prompt();
  await prompt.userChoice;
  installPrompt = undefined;
  emit({ canInstall: false });
}
