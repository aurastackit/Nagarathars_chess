"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/classes", label: "Online Classes" },
  { href: "/tournaments", label: "Online Tournament" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
          <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="font-semibold text-navy leading-tight">
            Nagarathar&apos;s Chess
            <span className="block text-xs font-normal text-foreground/60">Championship</span>
          </span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-foreground/80 sm:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-navy">
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border sm:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Toggle menu</span>
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          )}
        </button>
      </div>
      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-2 text-sm font-medium text-foreground/80 sm:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-2 transition-colors hover:bg-background hover:text-navy"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
