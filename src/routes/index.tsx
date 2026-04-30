import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listColleges, listLocations, getSavedIds, type College } from "@/lib/colleges";
import { useAuth } from "@/lib/auth";
import { CollegeCard } from "@/components/CollegeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Browse colleges — CollegeFinder" },
      { name: "description", content: "Search colleges by name, filter by city and fees, save favourites and compare." },
    ],
  }),
  component: BrowsePage,
});

const FEE_BUCKETS: { label: string; min?: number; max?: number }[] = [
  { label: "Any fees" },
  { label: "Under ₹1L", max: 100000 },
  { label: "₹1L – ₹3L", min: 100000, max: 300000 },
  { label: "₹3L – ₹6L", min: 300000, max: 600000 },
  { label: "₹6L+", min: 600000 },
];

const PAGE_SIZE = 9;

function BrowsePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [location, setLocation] = useState<string>("__all");
  const [feeIdx, setFeeIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [locations, setLocations] = useState<string[]>([]);
  const [items, setItems] = useState<College[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => { listLocations().then(setLocations).catch(() => {}); }, []);

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    getSavedIds(user.id).then(setSavedIds).catch(() => {});
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debounced, location, feeIdx]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const bucket = FEE_BUCKETS[feeIdx];
    listColleges({
      search: debounced,
      location: location === "__all" ? null : location,
      minFees: bucket.min,
      maxFees: bucket.max,
      page,
      pageSize: PAGE_SIZE,
    })
      .then(({ data, count }) => {
        if (cancelled) return;
        setItems(data);
        setCount(count);
      })
      .catch((e) => { if (!cancelled) setError(e.message ?? "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, location, feeIdx, page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const hasFilters = useMemo(
    () => debounced !== "" || location !== "__all" || feeIdx !== 0,
    [debounced, location, feeIdx],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Find your college.</h1>
        <p className="mt-2 text-muted-foreground">
          Browse {count > 0 ? `${count} ` : ""}colleges, compare them side by side, and save your shortlist.
        </p>
      </section>

      <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by college name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="md:w-56"><SelectValue placeholder="All locations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All locations</SelectItem>
            {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(feeIdx)} onValueChange={(v) => setFeeIdx(Number(v))}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FEE_BUCKETS.map((b, i) => <SelectItem key={b.label} value={String(i)}>{b.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" onClick={() => { setSearch(""); setLocation("__all"); setFeeIdx(0); }}>
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg border border-border bg-secondary/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No colleges match your filters.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <CollegeCard
                key={c.id}
                college={c}
                saved={savedIds.has(c.id)}
                onSavedChange={(s) => setSavedIds((prev) => {
                  const next = new Set(prev);
                  if (s) next.add(c.id); else next.delete(c.id);
                  return next;
                })}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <span className="px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
