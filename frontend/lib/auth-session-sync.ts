/** Cross-tab signal when school/admin session changes in this browser. */
const AUTH_EVENT_KEY = "icape-auth-changed";

export function broadcastAuthChanged() {
  try {
    localStorage.setItem(AUTH_EVENT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function subscribeAuthChanged(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === AUTH_EVENT_KEY) onChange();
  }
  function onFocus() {
    onChange();
  }
  function onVisibility() {
    if (document.visibilityState === "visible") onChange();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
