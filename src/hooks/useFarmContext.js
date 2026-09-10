import { useEffect, useState } from "react";
import { getFarmContext } from "../services/profileService";

/**
 * ============================================================
 * useFarmContext — central React hook (USA-2.1)
 *
 * Single, reusable way for any component to obtain the farm context
 * (measurementSystem, currency, country, ...) resolved by
 * getFarmContext(). Avoids repeating the getFarmContext().then(...)
 * boilerplate in every component and keeps a single source of truth.
 *
 * Returns `null` until loaded — the central formatters
 * (units.js / currency.js) treat a null context as the SA default
 * (metric / ZAR), so components render safely before it resolves and
 * SA behaviour is preserved.
 * ============================================================
 */
export default function useFarmContext() {
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    let mounted = true;
    getFarmContext()
      .then((c) => { if (mounted) setCtx(c); })
      .catch(() => { /* formatters fall back to metric/ZAR */ });
    return () => { mounted = false; };
  }, []);

  return ctx;
}
