"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import "./topbar.css";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/heroes", label: "Win Rates" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/players", label: "Players" },
];

export default function Topbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="topbar">
      <Link href="/" className="topbar-logo">
        DL<span>GG</span>
      </Link>

      {/* desktop links */}
      <div className="topbar-links">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`topbar-link ${pathname === link.href ? "active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* mobile hamburger button */}
      <button
        className="topbar-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* mobile dropdown menu */}
      {menuOpen && (
        <div className="topbar-mobile-menu">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`topbar-mobile-link ${pathname === link.href ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}