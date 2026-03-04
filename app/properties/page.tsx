import { db } from "@/lib/db";
import { properties, propertyImages } from "@/lib/db/schema";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import PropertyCardCompact from "@/components/shared/PropertyCardCompact";
import Link from "next/link";

const PER_PAGE = 20;

async function getProperties(search: string, page: number) {
  const offset = (page - 1) * PER_PAGE;

  const conditions = [
    eq(properties.isPublished, true),
    eq(properties.status, "AVAILABLE"),
    ...(search
      ? [
          or(
            ilike(properties.title, `%${search}%`),
            ilike(properties.location, `%${search}%`)
          ),
        ]
      : []),
  ];

  const [props, countResult] = await Promise.all([
    db
      .select()
      .from(properties)
      .where(and(...conditions))
      .limit(PER_PAGE)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / PER_PAGE);

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

  return { properties: withImages, total, totalPages, page };
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const search = searchParams.q ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));

  const { properties: props, total, totalPages } = await getProperties(search, page);

  function buildUrl(p: number, q: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const str = params.toString();
    return `/properties${str ? `?${str}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky search header ─────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form method="GET" action="/properties" className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                name="q"
                defaultValue={search}
                placeholder="Search by name or location..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              />
              {search && (
                <Link
                  href="/properties"
                  className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-700 transition shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Results count */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {search ? `Results for "${search}"` : "All Properties"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} propert{total === 1 ? "y" : "ies"} found
            {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
          </p>
        </div>

        {/* Grid */}
        {props.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {props.map((property) => (
                <PropertyCardCompact
                  key={property.id}
                  property={property}
                  firstImage={property.firstImage}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">

                {/* Prev */}
                {page > 1 ? (
                  <Link
                    href={buildUrl(page - 1, search)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-200 rounded-xl cursor-not-allowed">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </span>
                )}

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400">
                          ...
                        </span>
                      ) : (
                        <Link
                          key={p}
                          href={buildUrl(p as number, search)}
                          className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-xl transition ${
                            p === page
                              ? "bg-gray-900 text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </Link>
                      )
                    )}
                </div>

                {/* Next */}
                {page < totalPages ? (
                  <Link
                    href={buildUrl(page + 1, search)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-200 rounded-xl cursor-not-allowed">
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium text-gray-700">
              {search ? `No properties found for "${search}"` : "No properties available"}
            </p>
            <p className="text-sm text-gray-400 mt-2 mb-6">
              {search ? "Try a different search term." : "Check back soon."}
            </p>
            {search && (
              <Link
                href="/properties"
                className="inline-flex items-center px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition"
              >
                Clear Search
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}