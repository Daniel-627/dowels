import { db } from "@/lib/db";
import { properties, propertyImages, users, rentalRequests } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import RequestToRentForm from "@/components/forms/RequestToRentForm";

async function getProperty(id: string) {
  const result = await db
    .select({
      id: properties.id,
      title: properties.title,
      location: properties.location,
      rentAmount: properties.rentAmount,
      status: properties.status,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      description: properties.description,
      isPublished: properties.isPublished,
      landlordName: users.name,
    })
    .from(properties)
    .leftJoin(users, eq(properties.landlordId, users.id))
    .where(and(eq(properties.id, id), eq(properties.isPublished, true)))
    .limit(1);

  return result[0] ?? null;
}

async function getImages(propertyId: string) {
  return await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId));
}

async function getExistingRequest(propertyId: string, tenantId: string) {
  const result = await db
    .select()
    .from(rentalRequests)
    .where(
      and(
        eq(rentalRequests.propertyId, propertyId),
        eq(rentalRequests.tenantId, tenantId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const statusMessages: Record<string, string> = {
  PENDING: "Your request is under review. The landlord will respond shortly.",
  APPROVED: "Your request has been approved! The landlord will contact you soon.",
  REJECTED: "Unfortunately your request was not approved for this property.",
  CANCELLED: "You cancelled this rental request.",
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const [property, images] = await Promise.all([
    getProperty(id),
    getImages(id),
  ]);

  if (!property) notFound();

  // Check for existing request if logged in as tenant
  const existingRequest =
    session?.user?.role === "TENANT"
      ? await getExistingRequest(id, session.user.id)
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: Images + Details ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Image gallery */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src={images[0]?.url ?? "/placeholder-property.jpg"}
                alt={property.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1).map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={img.url}
                      alt={img.caption ?? "Property image"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Property details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {property.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {property.location}
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                property.status === "AVAILABLE"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {property.status.charAt(0) + property.status.slice(1).toLowerCase()}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">Monthly Rent</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  KES {Number(property.rentAmount).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">Bedrooms</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {property.bedrooms}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">Bathrooms</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {property.bathrooms}
                </p>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  About this property
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Request Form ─────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">

            {/* Already requested */}
            {existingRequest && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Your Request
                </h2>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[existingRequest.status]}`}>
                  {existingRequest.status.charAt(0) + existingRequest.status.slice(1).toLowerCase()}
                </span>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  {statusMessages[existingRequest.status]}
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Submitted {new Date(existingRequest.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Not logged in */}
            {!session && property.status === "AVAILABLE" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <p className="text-2xl mb-3">🏠</p>
                <h2 className="text-sm font-semibold text-gray-900">
                  Interested in this property?
                </h2>
                <p className="text-xs text-gray-500 mt-2 mb-4">
                  Create an account to submit a rental request.
                </p>
                <a
                  href={`/register?propertyId=${property.id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
                >
                  Register to Request
                </a>
                <a
                  href={`/login?callbackUrl=/properties/${property.id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition mt-2"
                >
                  Sign In
                </a>
              </div>
            )}

            {/* Logged in as tenant, no existing request */}
            {session?.user?.role === "TENANT" && !existingRequest && property.status === "AVAILABLE" && (
              <RequestToRentForm
                propertyId={property.id}
                propertyTitle={property.title}
                rentAmount={Number(property.rentAmount)}
              />
            )}

            {/* Logged in as landlord or admin */}
            {session && ["LANDLORD", "ADMIN"].includes(session.user.role) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <p className="text-xs text-gray-400">
                  You are viewing this as {session.user.role.toLowerCase()}.
                </p>
              </div>
            )}

            {/* Property not available */}
            {property.status !== "AVAILABLE" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <p className="text-2xl mb-3">🚫</p>
                <h2 className="text-sm font-semibold text-gray-900">
                  Not Available
                </h2>
                <p className="text-xs text-gray-500 mt-2">
                  This property is currently not accepting requests.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}