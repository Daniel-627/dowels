import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">

          {/* Brand — full width on mobile */}
          <div className="col-span-2 sm:col-span-1">
            <p className="text-lg font-bold text-gray-900">Dowels</p>
            <p className="text-sm text-gray-400 mt-1">by Dorcas Owela</p>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-xs">
              A smarter way to manage rentals — for landlords, tenants, and everyone in between.
            </p>
          </div>

          {/* Navigate */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Navigate</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Home", href: "/" },
                { label: "Properties", href: "/#properties" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-gray-900 transition"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Account</p>
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="text-sm text-gray-500 hover:text-gray-900 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm text-gray-500 hover:text-gray-900 transition"
              >
                Register
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Dowels. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Built with Next.js & Neon
          </p>
        </div>
      </div>
    </footer>
  );
}