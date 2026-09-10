"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Brand } from "@/components/brand";

const TABS = [
  { href: "/dashboard", label: "Today" },
  { href: "/log", label: "Log" },
  { href: "/progression", label: "Progress" },
  { href: "/routines", label: "Routines" },
  { href: "/me", label: "Me" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Top bar on desktop. No hamburger anywhere in this app. */
export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="hidden border-b border-line bg-ground/80 backdrop-blur sm:block">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-6 px-5 py-3">
        <Link href="/dashboard">
          <Brand />
        </Link>
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive(pathname, tab.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                isActive(pathname, tab.href)
                  ? "bg-raised font-medium text-accent"
                  : "text-muted hover:text-ink",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

/** Bottom tab bar on phones — thumb-reachable, which is where this app is used. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ground/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                  active ? "text-accent" : "text-faint",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 w-6 rounded-full transition-colors",
                    active ? "bg-accent" : "bg-transparent",
                  )}
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
