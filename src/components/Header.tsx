import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useCompare } from "@/lib/compare";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export function Header() {
  const { user, signOut, loading } = useAuth();
  const { ids } = useCompare();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <GraduationCap className="h-5 w-5" />
          <span>CollegeFinder</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Browse
          </Link>
          <Link
            to="/compare"
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-foreground" }}
          >
            Compare {ids.length > 0 && <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-xs">{ids.length}</span>}
          </Link>
          {user && (
            <Link
              to="/saved"
              className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-foreground" }}
            >
              Saved
            </Link>
          )}
          <div className="ml-2">
            {loading ? null : user ? (
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                Sign out
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate({ to: "/auth" })}>Sign in</Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}