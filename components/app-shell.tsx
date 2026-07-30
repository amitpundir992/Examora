"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BarChart3, BookOpenCheck, CreditCard, FileUp, LogOut, Menu, Sparkles, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/exams", label: "Exams", icon: BookOpenCheck },
  { href: "/upload", label: "Upload PDF", icon: FileUp },
  { href: "/ai-generator", label: "AI Generator", icon: Sparkles },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function AppShell({ children, plan }: { children: React.ReactNode; plan: "FREE" | "PRO" }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            E
          </span>
          Examora
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-4">
          {session?.user && (
            <div className="rounded-md border bg-muted/50 p-3">
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{session.user.name}</p>
                    <Badge className={plan === "PRO" ? "border-success text-success" : ""}>
                      {plan === "PRO" ? "Pro" : "Free"}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-md bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">v0.1 MVP</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-40 flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Link href="/" className="font-semibold">Examora</Link>
          <div className="flex items-center gap-2">
            <Link href="/billing"><Badge>{plan === "PRO" ? "Pro" : "Free"}</Badge></Link>
            <ThemeToggle />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Open menu"
              aria-label="Open navigation menu"
              aria-controls="mobile-app-navigation"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close navigation menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside
              id="mobile-app-navigation"
              aria-label="Application navigation"
              className="relative flex h-full w-[min(20rem,85vw)] flex-col border-r bg-card p-4 shadow-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
                    E
                  </span>
                  Examora
                </Link>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close navigation menu"
                  title="Close menu"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    menuButtonRef.current?.focus();
                  }}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active && "bg-muted text-foreground",
                      )}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto border-t pt-4">
                {session?.user ? (
                  <div className="mb-4 flex items-center gap-3">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{session.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                    <Badge className={plan === "PRO" ? "border-success text-success" : ""}>
                      {plan === "PRO" ? "Pro" : "Free"}
                    </Badge>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-muted px-3 text-sm font-medium hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
