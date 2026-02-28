import { db } from "@/lib/db";
import { rentalRequests, properties, propertyImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

async function getTenantRequests(tenantId: string) {
  const reqs = await db
    .select({
      id: rentalRequests.id,
      status: rentalRequests.status,
      moveInDate: rentalRequests.moveInDate,
      occupants: rentalRequests.occupants,
      message: rentalRequests.message,
      createdAt: rentalRequests.createdAt,
      reviewedAt: rentalRequests.reviewedAt,
      propertyId: properties.id,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
      propertyRent: properties.rentAmount,
      propertyBedrooms: properties.bedrooms,
      propertyBathrooms: properties.bathrooms,
    })
    .from(rentalRequests)
    .leftJoin(properties, eq(rentalRequests.propertyId, properties.id))
    .where(eq(rentalRequests.tenantId, tenantId))
    .orderBy(rentalRequests.createdAt);

  const withImages = await Promise.all(
    reqs.map(async (req) => {
      if (!req.propertyId) return { ...req, firstImage: null };
      const images = await db
        .select()
        .from(propertyImages)
        .where(eq(propertyImages.propertyId, req.propertyId))
        .limit(1);
      return { ...req, firstImage: images[0]?.url ?? null };
    })
  );

  return withImages;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const statusMessages: Record<string, string> = {
  PENDING: "Your request is under review.",
  APPROVED: "Approved! Your landlord will be in touch.",
  REJECTED: "This request was not approved.",
  CANCELLED: "You cancelled this request.",
};

export default async function TenantRequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const requests = await getTenantRequests(session.user.id);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          {requests.length} request{requests.length === 1 ? "" : "s"} submitted
        </p>
      </div>

      {requests.length > 0 ? (
        <div className="flex flex-col gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col sm:flex-row"
            >
              {/* Image */}
              <div className="relative w-full sm:w-48 h-40 sm:h-auto bg-gray-100 shrink-0">
                <Image
                  src={req.firstImage ?? "/placeholder-property.jpg"}
                  alt={req.propertyTitle ?? "Property"}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {req.propertyTitle}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {req.propertyLocation} · {req.propertyBedrooms} bed · {req.propertyBathrooms} bath
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        KES {Number(req.propertyRent).toLocaleString()}
                        <span className="text-xs text-gray-400 font-normal ml-1">/mo</span>
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusStyles[req.status]}`}>
                      {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    {statusMessages[req.status]}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>Move-in: {new Date(req.moveInDate).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}</span>
                    <span>{req.occupants} {req.occupants === 1 ? "person" : "people"}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Submitted {new Date(req.createdAt).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-lg font-medium text-gray-600">No requests yet</p>
          <p className="text-sm mt-2 mb-6">
            Find a property you like and submit a rental request.
          </p>
          <Link
            href="/#properties"
            className="inline-flex items-center px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
          >
            Browse Properties
          </Link>
        </div>
      )}
    </div>
  );
}