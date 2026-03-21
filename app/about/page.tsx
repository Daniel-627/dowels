import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

      {/* Hero */}
      <div className="max-w-2xl mb-14 sm:mb-20">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">
          About Dowels
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          Rental management, built for Kenya.
        </h1>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-500 leading-relaxed">
          Dowels is a property rental platform that connects landlords and tenants
          through a simple, transparent process. No middlemen, no confusion —
          just clear agreements and organised records.
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/properties"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
          >
            Browse Properties
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Get in Touch
          </Link>
        </div>
      </div>

      {/* Mission */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mb-14 sm:mb-20">
        <div className="p-5 sm:p-6 bg-gray-50 rounded-2xl">
          <p className="text-2xl mb-3">🏠</p>
          <h3 className="font-semibold text-gray-900 mb-2">For Tenants</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Browse verified listings, submit rental requests, track your invoices
            and payment history — all in one place.
          </p>
        </div>
        <div className="p-5 sm:p-6 bg-gray-50 rounded-2xl">
          <p className="text-2xl mb-3">🔑</p>
          <h3 className="font-semibold text-gray-900 mb-2">For Landlords</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Manage your portfolio, review tenant applications, create invoices,
            record payments and track expenses with ease.
          </p>
        </div>
        <div className="p-5 sm:p-6 bg-gray-50 rounded-2xl">
          <p className="text-2xl mb-3">📊</p>
          <h3 className="font-semibold text-gray-900 mb-2">Clear Financials</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Export balance sheets, payment reports and expense summaries as PDF
            or CSV whenever you need them.
          </p>
        </div>
      </div>

      {/* Company */}
      <div className="border-t border-gray-100 pt-12 sm:pt-16 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">
            Our Company
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            A product of Dorcas Owela
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Dowels is built and maintained by OpenDoor, a company focused on
            creating practical software solutions for the African real estate
            market. We believe property management should be accessible,
            affordable and straightforward for everyone.
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 sm:mb-6">
            By the numbers
          </p>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 sm:pb-4">
              <span className="text-sm text-gray-300">Platform</span>
              <span className="font-semibold">Dowels v1.0</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3 sm:pb-4">
              <span className="text-sm text-gray-300">Market</span>
              <span className="font-semibold">Kenya</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3 sm:pb-4">
              <span className="text-sm text-gray-300">Currency</span>
              <span className="font-semibold">KES</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Company</span>
              <span className="font-semibold">OpenDoor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}