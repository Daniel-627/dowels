import { db } from "@/lib/db";
import { properties, propertyImages, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PropertyImageUpload from "@/components/forms/PropertyImageUpload";
import Image from "next/image";

async function getProperty(id: string) {
  const result = await db
    .select({
      id: properties.id,
      title: properties.title,
      location: properties.location,
      rentAmount: properties.rentAmount,
      status: properties.status,
      isPublished: properties.isPublished,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      description: properties.description,
      landlordName: users.name,
    })
    .from(properties)
    .leftJoin(users, eq(properties.landlordId, users.id))
    .where(eq(properties.id, id))
    .limit(1);

  return result[0] ?? null;
}

async function getImages(propertyId: string) {
  return await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId));
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [property, images] = await Promise.all([
    getProperty(id),
    getImages(id),
  ]);

  if (!property) notFound();

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{property.location}</p>
      </div>

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Rent</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              KES {Number(property.rentAmount).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Bedrooms</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{property.bedrooms}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Bathrooms</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{property.bathrooms}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-lg font-bold text-gray-900 mt-1 capitalize">
              {property.status.toLowerCase()}
            </p>
          </div>
        </div>

        {property.description && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">
            {property.description}
          </p>
        )}

        <p className="mt-4 text-xs text-gray-400">
          Landlord: {property.landlordName ?? "—"}
        </p>
      </div>

      {/* Existing images */}
      {images.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Property Images ({images.length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={img.url}
                  alt={img.caption ?? "Property image"}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Upload Images
        </h2>
        <PropertyImageUpload propertyId={property.id} />
      </div>
    </div>
  );
}