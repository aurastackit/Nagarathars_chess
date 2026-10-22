"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/registrations", label: "Players" },
  { href: "/admin/tournaments", label: "Tournaments" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/emails/preview", label: "Emails" },
  { href: "/admin/activity", label: "Activity" },
];

/** Admin section links; scrolls sideways on a phone rather than wrapping. */
export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1 text-sm font-medium">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`block whitespace-nowrap rounded-md px-3 py-1.5 transition-colors ${
                isActive(link.href)
                  ? "bg-background/15 text-background"
                  : "text-background/70 hover:bg-background/10 hover:text-background"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
