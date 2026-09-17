"use client";

import { useEffect, useState } from "react";

/** Debounce a string value for live admin list filtering. */
export function useDebouncedValue(value: string, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
