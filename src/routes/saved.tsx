import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listSavedColleges, type College } from "@/lib/colleges";
import { CollegeCard } from "@/components/CollegeCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved colleges — CollegeFinder" },
      { name: "description", content: "Your shortlisted colleges in one place." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    let cancel = false;
    setLoading(true);
    listSavedColleges(user.id)
      .then((r) => { if (!cancel) setItems(r); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [user, authLoading, navigate]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Saved colleges</h1>
      <p className="mb-8 text-sm text-muted-foreground">Your shortlist — only visible to you.</p>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg bg-secondary/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">You haven't saved any colleges yet.</p>
          <Button asChild className="mt-4"><Link to="/">Browse colleges</Link></Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <CollegeCard
              key={c.id}
              college={c}
              saved
              onSavedChange={(s) => { if (!s) setItems((prev) => prev.filter((x) => x.id !== c.id)); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}