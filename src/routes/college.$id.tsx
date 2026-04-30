import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCollege, formatINR, saveCollege, unsaveCollege, getSavedIds, type College } from "@/lib/colleges";
import { useAuth } from "@/lib/auth";
import { useCompare } from "@/lib/compare";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ArrowLeft, Bookmark, BookmarkCheck, GitCompare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/college/$id")({
  component: CollegeDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Couldn't load this college</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button className="mt-4" onClick={() => { router.invalidate(); reset(); }}>Try again</Button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h2 className="text-xl font-semibold">College not found</h2>
      <Button className="mt-4" asChild><Link to="/">Back to browse</Link></Button>
    </div>
  ),
});

function CollegeDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const compare = useCompare();
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    getCollege(id)
      .then((c) => { if (!cancel) setCollege(c); })
      .catch((e) => { if (!cancel) setError(e.message); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [id]);

  useEffect(() => {
    if (!user) { setSaved(false); return; }
    getSavedIds(user.id).then((s) => setSaved(s.has(id))).catch(() => {});
  }, [user, id]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-10"><div className="h-64 animate-pulse rounded-lg bg-secondary/40" /></div>;
  if (error) return <div className="mx-auto max-w-4xl px-4 py-10 text-destructive">{error}</div>;
  if (!college) return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h2 className="text-xl font-semibold">College not found</h2>
      <Button className="mt-4" asChild><Link to="/">Back to browse</Link></Button>
    </div>
  );

  const p = college.placements;
  const inCompare = compare.has(college.id);

  const handleSave = async () => {
    if (!user) { toast.message("Sign in to save"); return; }
    setBusy(true);
    try {
      if (saved) { await unsaveCollege(user.id, college.id); setSaved(false); }
      else { await saveCollege(user.id, college.id); setSaved(true); }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to browse
      </Link>

      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{college.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {college.location}</span>
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current" /> {college.rating.toFixed(1)} rating</span>
            <span>{formatINR(college.fees)} / year</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={inCompare ? "default" : "outline"} onClick={() => {
            if (!inCompare && compare.full) { toast.message("You can compare up to 3"); return; }
            compare.toggle(college.id);
          }}>
            <GitCompare className="mr-2 h-4 w-4" /> {inCompare ? "In compare" : "Add to compare"}
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={busy}>
            {saved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </header>

      <Section title="Overview">
        <p className="text-[15px] leading-relaxed text-muted-foreground">{college.overview}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Annual fees" value={formatINR(college.fees)} />
          <Stat label="Location" value={college.location} />
          <Stat label="Rating" value={`${college.rating.toFixed(1)} / 5`} />
        </dl>
      </Section>

      <Section title="Courses offered">
        <ul className="grid gap-2 sm:grid-cols-2">
          {college.courses.map((c) => (
            <li key={c} className="rounded-md border border-border bg-card px-3 py-2 text-sm">{c}</li>
          ))}
        </ul>
      </Section>

      <Section title="Placements">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Stat label="Placement %" value={`${p.placement_percentage}%`} />
          <Stat label="Average package" value={`${p.avg_package_lpa} LPA`} />
          <Stat label="Highest package" value={`${p.highest_package_lpa} LPA`} />
        </dl>
        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Top recruiters</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.top_recruiters.map((r) => (
              <span key={r} className="rounded-md bg-secondary px-3 py-1 text-sm">{r}</span>
            ))}
          </div>
        </div>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-8 last:border-0">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}