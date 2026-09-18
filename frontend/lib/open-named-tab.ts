/**
 * Open (or focus) a named browser tab.
 * Reuses the existing tab with the same name when it is still open —
 * does not create a new tab on every click.
 */
export function openNamedTab(url: string, name: string) {
  if (typeof window === "undefined") return;

  const absolute = new URL(url, window.location.origin).href;
  const targetPath = new URL(absolute).pathname;

  // Empty URL + name focuses an existing named tab, or opens a blank one.
  const win = window.open("", name);
  if (!win) return;

  try {
    const href = win.location.href;
    const isBlank = !href || href === "about:blank" || href === "about:newtab";

    if (isBlank) {
      win.location.replace(absolute);
    } else if (win.location.pathname !== targetPath) {
      // Same named tab, different page — navigate in place.
      win.location.href = absolute;
    }
    // Same path already open — focus only (no reload).
  } catch {
    try {
      win.location.href = absolute;
    } catch {
      window.open(absolute, name);
    }
  }

  try {
    win.focus();
  } catch {
    /* ignore */
  }
}

export const TAB_NAMES = {
  school: "icape-school",
  admin: "icape-admin",
} as const;
