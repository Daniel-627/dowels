import { db } from "@/lib/db";
import { properties, propertyImages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";
import PropertyImageUpload from "@/components/forms/PropertyImageUpload";
import PublishToggle from "@/components/shared/PublishToggle";
import Link from "next/link";

async function getProperty(id: string, landlordId: string) {
  const result = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.landlordId, landlordId)))
    .limit(1);
  return result[0] ?? null;
}

async function getImages(propertyId: string) {
  return await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId));
}

export default async function LandlordPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const [property, images] = await Promise.all([
    getProperty(id, session.user.id),
    getImages(id),
  ]);

  if (!property) notFound();

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/dashboard/landlord/properties"
            className="text-xs text-gray-400 hover:text-gray-600 transition mb-2 inline-block"
          >
            ← Back to Properties
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{property.location}</p>
          <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${
            property.isPublished
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {property.isPublished ? "Published" : "Pending admin approval"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PublishToggle
            propertyId={property.id}
            isPublished={property.isPublished}
          />
          <span className="text-xs text-gray-400">
            {property.isPublished ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      {/* Details */}
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
            <p className="text-lg font-bold text-gray-900 mt-1">
              {property.bedrooms}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Bathrooms</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {property.bathrooms}
            </p>
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
      </div>

      {/* Existing images */}
      {images.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Property Images ({images.length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
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
        </div>
      )}

      {/* Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          Upload Images
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Add photos to make your listing more attractive to tenants.
        </p>
        <PropertyImageUpload propertyId={property.id} />
      </div>
    </div>
  );
}