import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates once `value`
 * has stopped changing for `delayMs`. Used to avoid firing an API
 * request on every keystroke in a search box - only once typing pauses.
 */
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
