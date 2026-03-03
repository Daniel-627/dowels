import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { db } from "@/lib/db";
import { properties, propertyImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import PropertyCard from "@/components/shared/PropertyCard";

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
  const props = await db
    .select()
    .from(properties)
    .where(eq(properties.isPublished, true));

  const withImages = await Promise.all(
    props.map(async (p) => {
      const images = await db
        .select()
        .from(propertyImages)
        .where(eq(propertyImages.propertyId, p.id))
        .limit(1);
      return { ...p, firstImage: images[0]?.url ?? null };
    })
  );

  return withImages;
}

export default async function HomePage() {
  const [content, availableProperties] = await Promise.all([
    getHomePage(),
    getAvailableProperties(),
  ]);

  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="relative w-full min-h-screen flex items-center">
        {content?.heroImage ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={urlFor(content.heroImage).width(1600).url()}
              alt="Hero"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/55" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gray-900" />
        )}

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {content?.heroTitle ?? "Find Your Perfect Home"}
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-200 leading-relaxed">
              {content?.heroSubtitle ?? "Browse verified rental properties. Simple, transparent, and hassle-free."}
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col xs:flex-row gap-3 sm:gap-4">
              <a
                href="#properties"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition text-sm"
              >
                {content?.heroCtaText ?? "Browse Properties"}
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition text-sm"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Properties */}
      <section id="properties" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Available Properties
              </h2>
              <p className="mt-1 sm:mt-2 text-sm text-gray-500">
                {availableProperties.length} propert{availableProperties.length === 1 ? "y" : "ies"} available right now
              </p>
            </div>
          </div>

          {availableProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {availableProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  firstImage={property.firstImage}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-24 text-gray-400">
              <p className="text-base sm:text-lg font-medium">No properties available right now</p>
              <p className="text-sm mt-2">Check back soon — new listings are added regularly.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}