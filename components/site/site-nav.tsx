import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";

export function SiteNav() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-accent" />
          <span className="font-display text-lg font-semibold">Script Factory</span>
        </Link>
        <nav className="hidden gap-8 font-mono text-sm text-muted-foreground md:flex">
          <Link href="#features" className="hover:text-foreground">
            features
          </Link>
          <Link href="#security" className="hover:text-foreground">
            security
          </Link>
          <Link href="#faq" className="hover:text-foreground">
            faq
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/dashboard">Start building</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
