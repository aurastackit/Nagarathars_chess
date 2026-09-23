"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/announcement-bar";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/classes", label: "Online Classes" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type NextTournament = { title: string; slug: string; registrationDeadline: string } | null;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ nextTournament }: { nextTournament: NextTournament }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu automatically if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 640) setMenuOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Body scroll lock + focus trap + Esc-to-close while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const container = menuRef.current;
    const focusable = container
      ? Array.from(container.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"))
      : [];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (e.key === "Tab" && focusable.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const registerHref = nextTournament ? `/tournaments/${nextTournament.slug}` : null;

  return (
    <>
      {nextTournament && (
        <AnnouncementBar
          title={nextTournament.title}
          slug={nextTournament.slug}
          registrationDeadline={nextTournament.registrationDeadline}
        />
      )}
      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          scrolled
            ? "border-border bg-card/80 shadow-sm backdrop-blur-md"
            : "border-transparent bg-background"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10 object-contain"
            />
            <span className="font-semibold text-charcoal leading-tight">
              Nagarathar&apos;s Chess
              <span className="block text-xs font-normal text-foreground/60">Championship</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
            {NAV.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 transition-colors ${
                    active
                      ? "bg-charcoal text-white shadow-sm"
                      : "text-foreground/70 hover:bg-charcoal/10 hover:text-charcoal"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            {registerHref && (
              <Link
                href={registerHref}
                className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:bg-gold/90"
              >
                Register Now
              </Link>
            )}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border sm:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">Toggle menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              />
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="site-menu-overlay fixed inset-0 z-[60] flex flex-col bg-charcoal text-white sm:hidden"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
              <span className="font-semibold leading-tight">
                Nagarathar&apos;s Chess
                <span className="block text-xs font-normal text-white/60">Championship</span>
              </span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20"
              onClick={() => {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-center justify-center gap-2">
            {NAV.map((item, i) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`site-menu-item rounded-md px-4 py-2 text-2xl font-semibold transition-colors ${
                    active ? "text-gold" : "text-white/85 hover:text-gold"
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            {registerHref && (
              <Link
                href={registerHref}
                className="site-menu-item mt-6 rounded-full bg-gold px-6 py-3 text-base font-semibold text-charcoal shadow-sm transition-colors hover:bg-gold/90"
                style={{ animationDelay: `${NAV.length * 40}ms` }}
                onClick={() => setMenuOpen(false)}
              >
                Register Now
              </Link>
            )}
          </nav>
        </div>
      )}

      <style>{`
        @keyframes siteMenuFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes siteMenuItemIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .site-menu-overlay {
          animation: siteMenuFadeIn 200ms ease-out both;
        }
        .site-menu-item {
          animation: siteMenuItemIn 260ms ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .site-menu-overlay, .site-menu-item {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
