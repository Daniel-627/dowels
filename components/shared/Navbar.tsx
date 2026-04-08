"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
  href="/"
  className="flex items-center gap-2 shrink-0"
  onClick={() => setMenuOpen(false)}
>
  <div>
    <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-none block">
      Dowels Real Estate Management System
    </span>
    <span className="text-xs text-gray-400 font-normal leading-none block">
      by Dorcas Owela
    </span>
  </div>
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

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link
                href={`/dashboard/${session.user.role.toLowerCase()}`}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          title="Toggle menu"
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
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
        <>
          <div
            className="md:hidden fixed inset-0 top-16 bg-black/20 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden absolute top-16 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg px-4 py-5 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? "text-gray-900 font-medium bg-gray-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
              {session ? (
                <>
                  <Link
                    href={`/dashboard/${session.user.role.toLowerCase()}`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-sm font-medium text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-center"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-sm font-medium text-white bg-gray-900 px-4 py-2.5 rounded-lg hover:bg-gray-700 transition text-center"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-sm font-medium text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-center"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-sm font-medium text-white bg-gray-900 px-4 py-2.5 rounded-lg hover:bg-gray-700 transition text-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}