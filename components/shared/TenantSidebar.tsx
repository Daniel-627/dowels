"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Overview", href: "/dashboard/tenant", icon: "▦" },
  { label: "My Requests", href: "/dashboard/tenant/requests", icon: "📋" },
  { label: "My Invoices", href: "/dashboard/tenant/invoices", icon: "🧾" },
  { label: "Settings", href: "/dashboard/tenant/settings", icon: "⚙️" },
];

export default function TenantSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const NavLinks = () => (
    <>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard/tenant"
              ? pathname === "/dashboard/tenant"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800 flex flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          <span>🌐</span>
          Browse Properties
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition w-full text-left"
        >
          <span>🚪</span>
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-gray-900 min-h-screen flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <p className="text-white font-bold text-lg">Dowels</p>
          <p className="text-gray-500 text-xs mt-0.5">Tenant Portal</p>
        </div>
        <NavLinks />
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 h-14 flex items-center justify-between px-4">
        <div>
          <p className="text-white font-bold text-base">Dowels</p>
          <p className="text-gray-500 text-xs">Tenant Portal</p>
        </div>
        <button
          title="Toggle menu"
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-14 bg-black/40 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="lg:hidden fixed top-14 left-0 bottom-0 w-72 z-50 bg-gray-900 flex flex-col overflow-y-auto">
            <NavLinks />
          </div>
        </>
      )}

      {/* ── Mobile top bar spacer ──────────────────────────────────────── */}
      <div className="lg:hidden h-14 shrink-0" />
    </>
  );
}