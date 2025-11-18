import { useEffect, useRef } from "react";

export function useDebouncedEffect(effect: () => void | Promise<void>, deps: any[], delay: number) {
  const handler = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return; // ★ Disable in local development

    if (handler.current) clearTimeout(handler.current);

    handler.current = setTimeout(() => {
      effect();
    }, delay);

    return () => {
      if (handler.current) clearTimeout(handler.current);
    };
  }, deps);
}
