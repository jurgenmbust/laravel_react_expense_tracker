import { useEffect, useState } from "react";
import { errorMessage } from "../services/api";

// A stable load function comes from useCallback in the parent component.
// AbortController prevents old filter responses from replacing current data.
export function useResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  revision = 0,
) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    load(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [load, revision]);
  return { data, loading, error };
}
