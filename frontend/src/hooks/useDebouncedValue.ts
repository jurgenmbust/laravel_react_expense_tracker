import { useEffect, useState } from "react";
// A short pause avoids sending a request after every keystroke.
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return result;
}
