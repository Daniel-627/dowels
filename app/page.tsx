import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

async function getHomePage() {
  return await client.fetch(`
    *[_type == "homePage"][0] {
      heroTitle,
      heroSubtitle,
      heroCtaText,
      heroImage,
      featuresTitle,
      features[] {
        icon,
        title,
        description
      }
    }
  `);
}

export default async function HomePage() {
  const content = await getHomePage();

  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[90vh] flex items-center">

        {/* Background image */}
        {content?.heroImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={urlFor(content.heroImage).width(1600).url()}
              alt="Hero"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}

        {/* Fallback background if no image */}
        {!content?.heroImage && (
          <div className="absolute inset-0 z-0 bg-gray-900" />
        )}

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {content?.heroTitle ?? "Find Your Perfect Home"}
            </h1>
            <p className="mt-6 text-lg text-gray-200 leading-relaxed">
              {content?.heroSubtitle ?? "Browse verified rental properties. Simple, transparent, and hassle-free."}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/properties"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition text-sm"
              >
                {content?.heroCtaText ?? "Browse Properties"}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition text-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      {content?.features?.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              {content?.featuresTitle ?? "Why Dowels?"}
            </h2>
            <p className="mt-4 text-gray-500 text-center max-w-xl mx-auto text-sm">
              Everything you need to find, rent, and manage your home in one place.
            </p>
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {content.features.map((feature: any, i: number) => (
                <div
                  key={i}
                  className="flex flex-col items-start p-6 rounded-2xl border border-gray-100 hover:shadow-md transition"
                >
                  <span className="text-4xl">{feature.icon}</span>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to find your next home?
          </h2>
          <p className="mt-4 text-gray-400 text-sm max-w-lg mx-auto">
            Browse our listed properties and submit a rental request in minutes.
          </p>
          <Link
            href="/properties"
            className="mt-8 inline-flex items-center justify-center px-8 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition text-sm"
          >
            View All Properties
          </Link>
        </div>
      </section>

    </div>
  );
}