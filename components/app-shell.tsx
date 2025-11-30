'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type SVGProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useAuth } from "@/app/_providers/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { name: "Upload Bill", href: "/upload", icon: UploadIcon },
  { name: "History", href: "/history", icon: HistoryIcon, requiresAuth: true },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="3" y="3" width="7" height="9" rx="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="11" width="7" height="10" rx="2" />
      <rect x="3" y="15" width="7" height="6" rx="2" />
    </svg>
  );
}

function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 16V4" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M7 9l5-5 5 5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 18h14" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="8" strokeWidth="1.5" />
      <path
        d="M12 8v4l2.5 2.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1.1 1.1a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9l-.1 1.5a1 1 0 0 1-1 .9h-1.6a1 1 0 0 1-1-.9l-.1-1.5a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0L4.3 17.6a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6L2.2 14a1 1 0 0 1-.9-1v-1.6a1 1 0 0 1 .9-1l1.5-.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1.1-1.1a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9l.1-1.5a1 1 0 0 1 1-.9h1.6a1 1 0 0 1 1 .9l.1 1.5a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6l1.5.1a1 1 0 0 1 .9 1V13a1 1 0 0 1-.9 1l-1.5.1a1 1 0 0 0-.9.6z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavigationList({
  pathname,
  onNavigate,
  isGuest,
}: {
  pathname: string | null;
  onNavigate?: () => void;
  isGuest: boolean;
}) {
  return (
    <nav className="mt-8 flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname?.startsWith(item.href);
        const disabled = Boolean(item.requiresAuth && isGuest);

        if (disabled) {
          return (
            <div
              key={item.name}
              className="flex flex-col gap-1 rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.name}
              </div>
              <p className="text-xs">
                Sign in to view your saved history.
              </p>
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              isActive
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, isGuest, displayName, signOut } = useAuth();

  return (
    <div className="font-sans bg-gradient-to-br from-slate-50 to-white text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200/80 bg-white/90 px-6 py-8 backdrop-blur lg:flex">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Image
              src="/MediGuard-Ai-Logo.png"
              alt="MediGuard AI logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl"
              priority
            />
            MediGuard <span className="text-blue-600">AI</span>
          </Link>
          <p className="mt-1 text-xs text-slate-500">
            Care finance intelligence
          </p>
          <NavigationList pathname={pathname} isGuest={isGuest} />
          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
            {isGuest ? (
              <>
                <p className="font-semibold text-slate-900">Guest mode</p>
                <p>You have 3 free analyses every 24 hours.</p>
                <p className="text-xs text-slate-500">
                  Sign in from the MediGuard app to save bills.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Signed in
                </p>
                <p className="font-semibold text-slate-900">
                  {displayName}
                </p>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign out
                </Button>
              </>
            )}
          </div>
          <div className="mt-4 space-y-1 rounded-2xl border border-slate-100 bg-white/60 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Need help?</p>
            <p>billing@mediguard.ai</p>
          </div>
        </aside>

        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold">
            <Image
              src="/MediGuard-Ai-Logo.png"
              alt="MediGuard AI logo"
              width={28}
              height={28}
              className="h-7 w-7 rounded-xl"
              priority
            />
            MediGuard <span className="text-blue-600">AI</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="space-y-1.5">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={cn(
                    "block h-0.5 w-5 rounded-full bg-slate-700 transition",
                    open && index === 0 && "translate-y-2 rotate-45",
                    open && index === 1 && "opacity-0",
                    open && index === 2 && "-translate-y-2 -rotate-45"
                  )}
                />
              ))}
            </div>
          </button>
        </div>

        {open ? (
          <div
            className="fixed inset-0 z-10 bg-black/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-20 w-72 border-r border-slate-200 bg-white px-6 py-6 transition-transform lg:hidden",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <NavigationList
            pathname={pathname}
            onNavigate={() => setOpen(false)}
            isGuest={isGuest}
          />
          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            {isGuest ? (
              <>
                <p className="text-sm font-semibold text-slate-900">
                  Guest mode
                </p>
                <p className="text-xs text-slate-500">
                  Sign in from the MediGuard app to save your bills and see history.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                >
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>

        <main className="flex-1 px-4 py-8 lg:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 px-5 py-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-500">Workspace</p>
                <p className="text-base font-semibold text-slate-900">
                  {user?.name ?? "Guest session"}
                </p>
              </div>
              <div className="flex gap-2">
                {isGuest ? (
                  <Button size="sm" variant="secondary" onClick={signInDemo}>
                    Sign in
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={signOut}>
                    Sign out
                  </Button>
                )}
                <Button size="sm" variant="secondary" href="/upload">
                  New upload
                </Button>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
