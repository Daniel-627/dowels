"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "Overview", href: "/dashboard/tenant", icon: "▦" },
  { label: "My Requests", href: "/dashboard/tenant/requests", icon: "📋" },
  { label: "My Invoices", href: "/dashboard/tenant/invoices", icon: "🧾" },
];

export default function TenantSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-gray-900 min-h-screen flex flex-col">

      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-800">
        <p className="text-white font-bold text-lg">Dowels</p>
        <p className="text-gray-500 text-xs mt-0.5">Tenant Portal</p>
      </div>

      {/* Nav */}
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

      {/* Bottom */}
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
    </aside>
  );
}