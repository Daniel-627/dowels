import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

      {/* Header */}
      <div className="max-w-xl mb-12 sm:mb-16">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">
          Contact Us
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          We'd love to hear from you.
        </h1>
        <p className="mt-3 sm:mt-4 text-gray-500 leading-relaxed text-sm sm:text-base">
          Whether you're a landlord looking to list your property, a tenant with
          a question, or someone who wants to partner with us — reach out.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">

        {/* Contact details */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-gray-50 rounded-2xl p-5 sm:p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Get in Touch
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📧</span>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <a
                    href="mailto:hello@dowels.co.ke"
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 transition"
                  >
                    hello@dowels.co.ke
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📞</span>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                  <a
                    href="tel:+254700000000"
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 transition"
                  >
                    +254 700 000 000
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📍</span>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Location</p>
                  <p className="text-sm font-medium text-gray-900">
                    Nairobi, Kenya
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 sm:p-6 text-white">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
              For Landlords
            </p>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              Interested in listing your property on Dowels? Register an account
              and our team will get you set up.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5 sm:mb-6">
            Frequently Asked
          </p>
          <div className="space-y-5 sm:space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                How do I apply for a property?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Browse available properties, create a free account, and submit a
                rental request with your details. The landlord will review and respond.
              </p>
            </div>
            <div className="border-t border-gray-50 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Is there a fee to use Dowels?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Dowels is free for tenants. Landlord pricing is available on
                request — contact us for details.
              </p>
            </div>
            <div className="border-t border-gray-50 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                How are payments handled?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Payments are recorded on the platform but made directly to your
                landlord via M-Pesa, bank transfer or cash. Dowels does not
                process payments.
              </p>
            </div>
            <div className="border-t border-gray-50 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Can I manage multiple properties?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Yes — landlords can manage unlimited properties, each with their
                own tenants, invoices, payments and expense records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}