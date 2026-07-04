"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./topbar.css";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/heroes", label: "Win Rates" },
  { href: "/players", label: "Players" },
];

export default function Topbar() {
  const pathname = usePathname();

  return (
    <nav className="topbar">
      <Link href="/" className="topbar-logo">
        DL<span>GG</span>
      </Link>
      <div className="topbar-links">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`topbar-link ${pathname === link.href ? "active" : ""}`}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
