import { useEffect, useState } from "react";
import { useCompare } from "@/lib/compare";
import { getCollegesByIds, type College } from "@/lib/colleges";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

export function CompareBar() {
  const { ids, remove, clear } = useCompare();
  const [items, setItems] = useState<College[]>([]);

  useEffect(() => {
    if (ids.length === 0) { setItems([]); return; }
    let cancelled = false;
    getCollegesByIds(ids).then((r) => { if (!cancelled) setItems(r); }).catch(() => {});
    return () => { cancelled = true; };
  }, [ids]);

  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-xl border border-border bg-card p-3 shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Compare ({ids.length}/3)
        </span>
        <div className="flex flex-1 flex-wrap gap-2">
          {items.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs">
              {c.name}
              <button onClick={() => remove(c.id)} aria-label="Remove" className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
        <Button size="sm" asChild disabled={ids.length < 2}>
          <Link to="/compare">Compare {ids.length >= 2 ? "" : "(need 2+)"}</Link>
        </Button>
      </div>
    </div>
  );
}