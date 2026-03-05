"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

const navGroups = [
  {
    label: "Operations",
    links: [
      { href: "/workorders", label: "Work Orders" },
      { href: "/alignments", label: "Alignments" },
    ],
  },
  {
    label: "Directory",
    links: [
      { href: "/customers", label: "Customers" },
      { href: "/vehicles", label: "Vehicles" },
    ],
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!openGroup) return;
    const close = (e: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openGroup]);

  const linkClass = (href: string) =>
    `block rounded px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href || pathname.startsWith(href + "/")
        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
        : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
    }`;

  const isGroupActive = (group: (typeof navGroups)[0]) =>
    group.links.some((l) => pathname === l.href || pathname.startsWith(l.href + "/"));

  const groupButtonClass = (group: (typeof navGroups)[0]) =>
    `rounded px-3 py-2 text-sm font-medium transition-colors ${
      openGroup === group.label || isGroupActive(group)
        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
        : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
    }`;

  return (
    <nav className="border-b border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16">
          <div className="flex flex-1 items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="shrink-0 text-base font-semibold text-zinc-900 dark:text-zinc-50 sm:text-lg"
            >
              Throttle Therapy Shop
            </Link>

            {/* Desktop nav */}
            <div className="hidden flex-1 items-center gap-1 md:flex md:justify-center">
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                Dashboard
              </Link>
              {navGroups.map((group) => (
                <div key={group.label} className="relative" ref={openGroup === group.label ? groupRef : undefined}>
                  <button
                    type="button"
                    onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                    className={groupButtonClass(group)}
                    aria-expanded={openGroup === group.label}
                    aria-haspopup="true"
                  >
                    {group.label}
                    <svg
                      className={`ml-1 inline h-4 w-4 transition-transform ${openGroup === group.label ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {openGroup === group.label && (
                    <div className="absolute left-0 top-full z-10 mt-1 min-w-[10rem] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                      {group.links.map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          className={`block px-3 py-2 ${pathname === href || pathname.startsWith(href + "/") ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"}`}
                          onClick={() => setOpenGroup(null)}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Link href="/settings" className={linkClass("/settings")}>
                Settings
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded p-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
              >
                Sign out
              </button>
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 md:hidden"
                aria-expanded={menuOpen}
                aria-label="Toggle menu"
              >
                <span className="sr-only">Open menu</span>
                {menuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`border-t border-zinc-200 dark:border-zinc-800 md:hidden ${menuOpen ? "block" : "hidden"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="space-y-1 pb-3 pt-2">
            <Link
              href="/dashboard"
              className={linkClass("/dashboard")}
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            {navGroups.map((group) => (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => setMobileExpanded(mobileExpanded === group.label ? null : group.label)}
                  className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  aria-expanded={mobileExpanded === group.label}
                >
                  {group.label}
                  <svg
                    className={`h-4 w-4 transition-transform ${mobileExpanded === group.label ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {mobileExpanded === group.label && (
                  <div className="space-y-1 border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
                    {group.links.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className={linkClass(href)}
                        onClick={() => setMenuOpen(false)}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/settings"
              className={linkClass("/settings")}
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
