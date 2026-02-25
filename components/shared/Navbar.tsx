"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            Dowels
          </span>
          <span className="text-xs text-gray-400 font-normal hidden sm:block">
            by Dorcas Owela
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? "text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <Link
              href={`/dashboard/${session.user.role.toLowerCase()}`}
              className="text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button title="Toggle menu"
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? "text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100">
            {session ? (
              <Link
                href={`/dashboard/${session.user.role.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 transition text-center"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 transition text-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}