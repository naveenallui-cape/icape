type Listener = (unreachable: boolean) => void;

let unreachable = false;
const listeners = new Set<Listener>();

const GATEWAY_STATUSES = new Set([502, 503, 504]);

function emit() {
  for (const listener of listeners) listener(unreachable);
}

export function isServerUnreachable() {
  return unreachable;
}

export function subscribeServerStatus(listener: Listener) {
  listener(unreachable);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reportServerUnreachable() {
  if (unreachable) return;
  unreachable = true;
  emit();
}

export function reportServerReachable() {
  if (!unreachable) return;
  unreachable = false;
  emit();
}

/** A real HTTP response means the API process answered, except gateway failures. */
export function reportFromHttpStatus(status: number) {
  if (GATEWAY_STATUSES.has(status)) {
    reportServerUnreachable();
    return;
  }
  reportServerReachable();
}
