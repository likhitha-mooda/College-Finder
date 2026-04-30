import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "compare:ids";
const MAX = 3;

type CompareCtx = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  full: boolean;
};

const Ctx = createContext<CompareCtx | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {}
  }, [ids]);

  const toggle = (id: string) =>
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX ? prev : [...prev, id]));
  const remove = (id: string) => setIds((prev) => prev.filter((x) => x !== id));
  const clear = () => setIds([]);
  const has = (id: string) => ids.includes(id);
  const full = ids.length >= MAX;

  return <Ctx.Provider value={{ ids, toggle, remove, clear, has, full }}>{children}</Ctx.Provider>;
}

export function useCompare() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}

export const COMPARE_MAX = MAX;