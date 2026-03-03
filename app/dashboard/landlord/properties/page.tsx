import { db } from "@/lib/db";
import { properties, propertyImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PublishToggle from "@/components/shared/PublishToggle";

async function getLandlordProperties(landlordId: string) {
  const props = await db
    .select()
    .from(properties)
    .where(eq(properties.landlordId, landlordId))
    .orderBy(properties.createdAt);

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

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  OCCUPIED: "bg-red-100 text-red-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
};

export default async function LandlordPropertiesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const landlordProperties = await getLandlordProperties(session.user.id);

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-sm text-gray-500 mt-1">
            {landlordProperties.length} propert{landlordProperties.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <Link
          href="/dashboard/landlord/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
        >
          + Add Property
        </Link>
      </div>

      {/* Grid */}
      {landlordProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {landlordProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col"
            >
              {/* Image */}
              <div className="relative h-44 w-full bg-gray-100">
                <Image
                  src={property.firstImage ?? "/placeholder-property.jpg"}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
                <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[property.status]}`}>
                  {property.status.charAt(0) + property.status.slice(1).toLowerCase()}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-gray-900">{property.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{property.location}</p>
                <p className="text-sm font-bold text-gray-900 mt-2">
                  KES {Number(property.rentAmount).toLocaleString()}
                  <span className="text-xs text-gray-400 font-normal ml-1">/mo</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {property.bedrooms} bed · {property.bathrooms} bath
                </p>

                {/* Published toggle + actions */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PublishToggle
                      propertyId={property.id}
                      isPublished={property.isPublished}
                    />
                    <span className="text-xs text-gray-400">
                      {property.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/landlord/properties/${property.id}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-4">🏠</p>
          <p className="text-lg font-medium text-gray-600">No properties yet</p>
          <p className="text-sm mt-2">Add your first property to get started.</p>
          <Link
            href="/dashboard/landlord/properties/new"
            className="inline-flex items-center mt-6 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
          >
            + Add Property
          </Link>
        </div>
      )}
    </div>
  );
}