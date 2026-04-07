import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import Link from "next/link";
import PropertyCard from "@/components/shared/PropertyCard";
import { eq, and, notInArray, sql } from "drizzle-orm";
import { rentalRequests } from "@/lib/db/schema";
import { getAvailablePropertyIds, attachImages, buildAvailableCondition } from "@/lib/queries/properties";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

async function getHomePage() {
  return await client.fetch(`
    *[_type == "homePage"][0] {
      heroTitle,
      heroSubtitle,
      heroCtaText,
      heroImage,
    }
  `);
}



async function getAvailableProperties() {
  const excludeIds = await getAvailablePropertyIds();
  const condition = buildAvailableCondition(excludeIds);

  const props = await db
    .select()
    .from(properties)
    .where(condition)
    .limit(12);

  return attachImages(props);
}

export default async function HomePage() {
  const [content, availableProperties] = await Promise.all([
    getHomePage(),
    getAvailableProperties(),
  ]);

  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[85vh] flex items-center">

        {/* Background */}
        {content?.heroImage ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={urlFor(content.heroImage).width(1600).url()}
              alt="Hero"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 to-gray-800" />
        )}

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-xl">

            <p className="text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
              Rental Management by OpenDoor
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {content?.heroTitle ?? "Find Your Perfect Home"}
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-300 leading-relaxed">
              {content?.heroSubtitle ?? "Browse verified rental properties across Kenya. Simple, transparent, and hassle-free."}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/properties"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition text-sm shadow-lg"
              >
                {content?.heroCtaText ?? "Browse Properties"}
              </a>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-white/40 text-white font-medium rounded-xl hover:bg-white/10 transition text-sm"
              >
                Create Account
              </Link>
            </div>

            {/* Trust bar */}
            <div className="mt-10 flex items-center gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-white">100%</p>
                <p className="text-xs text-white/50 mt-0.5">Verified</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-xl font-bold text-white">KES</p>
                <p className="text-xs text-white/50 mt-0.5">Local Currency</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-xl font-bold text-white">0</p>
                <p className="text-xs text-white/50 mt-0.5">Middlemen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Properties ───────────────────────────────────────────────────── */}
      <section id="properties" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Available Now
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Available Properties
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {availableProperties.length} propert{availableProperties.length === 1 ? "y" : "ies"} ready to move in
            </p>
          </div>

          {/* Grid */}
          {availableProperties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {availableProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    firstImage={property.firstImage}
                  />
                ))}
              </div>

              {/* View all button */}
              <div className="mt-10 sm:mt-14 text-center">
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition"
                >
                  View All Properties
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 sm:py-24 bg-white rounded-2xl border border-gray-100">
              <p className="text-4xl mb-4">🏠</p>
              <p className="text-base sm:text-lg font-medium text-gray-700">
                No properties available right now
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Check back soon — new listings are added regularly.
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}