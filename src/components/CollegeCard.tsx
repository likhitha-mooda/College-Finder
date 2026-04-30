import { Link } from "@tanstack/react-router";
import { Star, MapPin, Bookmark, BookmarkCheck, GitCompare } from "lucide-react";
import type { College } from "@/lib/colleges";
import { formatINR } from "@/lib/colleges";
import { useCompare } from "@/lib/compare";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { saveCollege, unsaveCollege } from "@/lib/colleges";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

type Props = {
  college: College;
  saved?: boolean;
  onSavedChange?: (saved: boolean) => void;
};

export function CollegeCard({ college, saved = false, onSavedChange }: Props) {
  const { user } = useAuth();
  const compare = useCompare();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(saved);
  const [busy, setBusy] = useState(false);

  const inCompare = compare.has(college.id);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.message("Sign in to save colleges");
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      if (isSaved) {
        await unsaveCollege(user.id, college.id);
        setIsSaved(false);
        onSavedChange?.(false);
      } else {
        await saveCollege(user.id, college.id);
        setIsSaved(true);
        onSavedChange?.(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCompare && compare.full) {
      toast.message(`You can compare up to 3 colleges`);
      return;
    }
    compare.toggle(college.id);
  };

  return (
    <Link
      to="/college/$id"
      params={{ id: college.id }}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/30"
    >
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-card-foreground group-hover:underline underline-offset-4">
            {college.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
            <Star className="h-3 w-3 fill-current" />
            {college.rating.toFixed(1)}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {college.location}
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {college.courses.slice(0, 3).map((c) => (
            <span key={c} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {c}
            </span>
          ))}
          {college.courses.length > 3 && (
            <span className="rounded px-2 py-0.5 text-xs text-muted-foreground">+{college.courses.length - 3}</span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-5 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Annual fees</div>
          <div className="text-sm font-semibold">{formatINR(college.fees)}</div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant={inCompare ? "default" : "outline"}
            onClick={handleCompare}
            aria-label={inCompare ? "Remove from compare" : "Add to compare"}
            className="h-8 w-8"
          >
            <GitCompare className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={busy}
            onClick={handleSave}
            aria-label={isSaved ? "Unsave" : "Save"}
            className="h-8 w-8"
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Link>
  );
}