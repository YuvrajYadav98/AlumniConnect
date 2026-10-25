import { useEffect, useState, useCallback } from "react";
import { getErrorMessage } from "../utils/getErrorMessage";

/**
 * Generic "fetch this on mount" hook used by all three role dashboards.
 * `fetcher` is an async function (e.g. getAdminDashboardStats) that
 * resolves to the response payload.
 */
export function useDashboardData(fetcher) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
