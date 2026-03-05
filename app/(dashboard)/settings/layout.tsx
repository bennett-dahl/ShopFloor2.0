"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsLinks = [
  { href: "/settings/parts", label: "Parts" },
  { href: "/settings/services", label: "Services" },
  { href: "/settings/alignment-types", label: "Alignment Types" },
  { href: "/settings/ride-height-references", label: "Ride Height References" },
];

export default function SettingsLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-6xl">
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-700">
        {settingsLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === href
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
