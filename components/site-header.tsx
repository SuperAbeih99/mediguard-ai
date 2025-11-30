'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/_providers/AuthContext";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isGuest, displayName, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          MediGuard <span className="text-blue-600">AI</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm font-medium"
            href="#pricing"
          >
            Contact
          </Button>
          <Button variant="secondary" size="sm" href="/upload">
            Launch app
          </Button>
          {!isGuest && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">
                {displayName}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <div className="space-y-1.5">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={cn(
                  "block h-0.5 w-5 rounded-full bg-slate-600 transition",
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
        <div className="border-t border-slate-200/60 bg-white/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl border border-transparent px-4 py-2 transition hover:border-slate-200 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Button variant="secondary" className="w-full" href="/upload">
              Launch app
            </Button>
            {!isGuest && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  Signed in as <span className="font-semibold">{displayName}</span>
                </div>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                >
                  Sign out
                </Button>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
