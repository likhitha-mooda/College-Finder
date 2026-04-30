import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCompare } from "@/lib/compare";
import { getCollegesByIds, formatINR, type College } from "@/lib/colleges";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare colleges — CollegeFinder" },
      { name: "description", content: "Compare colleges side by side: fees, placement %, rating, and location." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { ids, remove, clear } = useCompare();
  const [items, setItems] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    getCollegesByIds(ids)
      .then((r) => { if (!cancel) setItems(r); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [ids]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Compare colleges</h1>
          <p className="mt-1 text-sm text-muted-foreground">Side-by-side comparison of up to 3 colleges.</p>
        </div>
        {ids.length > 0 && <Button variant="ghost" onClick={clear}>Clear all</Button>}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-secondary/40" />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No colleges selected.</p>
          <Button asChild className="mt-4"><Link to="/">Browse colleges</Link></Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="w-40 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Attribute</th>
                {items.map((c) => (
                  <th key={c.id} className="px-4 py-3 text-left align-top">
                    <div className="flex items-start justify-between gap-2">
                      <Link to="/college/$id" params={{ id: c.id }} className="font-semibold hover:underline">
                        {c.name}
                      </Link>
                      <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-foreground" aria-label="Remove">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Location" cells={items.map((c) => c.location)} />
              <Row label="Annual fees" cells={items.map((c) => formatINR(c.fees))} />
              <Row
                label="Rating"
                cells={items.map((c) => (
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-current" />{c.rating.toFixed(1)}</span>
                ))}
              />
              <Row label="Placement %" cells={items.map((c) => `${c.placements.placement_percentage}%`)} />
              <Row label="Average package" cells={items.map((c) => `${c.placements.avg_package_lpa} LPA`)} />
              <Row label="Highest package" cells={items.map((c) => `${c.placements.highest_package_lpa} LPA`)} />
              <Row
                label="Courses"
                cells={items.map((c) => (
                  <div className="flex flex-wrap gap-1">
                    {c.courses.map((x) => <span key={x} className="rounded bg-muted px-1.5 py-0.5 text-xs">{x}</span>)}
                  </div>
                ))}
              />
              <Row
                label="Top recruiters"
                cells={items.map((c) => c.placements.top_recruiters.join(", "))}
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, cells }: { label: string; cells: React.ReactNode[] }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</td>
      {cells.map((c, i) => <td key={i} className="px-4 py-3 align-top">{c}</td>)}
    </tr>
  );
}