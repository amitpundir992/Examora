"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/exams", label: "Exams", icon: "📝" },
  { href: "/upload", label: "Upload PDF", icon: "📄" },
  { href: "/ai-generator", label: "AI Generator", icon: "✨" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

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
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-4">
          {session?.user && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{session.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="mt-3 w-full rounded-md bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
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

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Link href="/" className="font-semibold">
            Examora
          </Link>
          <div className="flex items-center gap-2">
            {session?.user && (
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm">
                Sign out
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
