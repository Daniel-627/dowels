import Link from "next/link";
import Image from "next/image";
import { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  firstImage?: string | null;
}

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  OCCUPIED: "bg-red-100 text-red-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
};

export default function PropertyCard({ property, firstImage }: PropertyCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition flex flex-col">

      {/* Image */}
<div className="relative h-48 w-full bg-gray-100">
  {firstImage ? (
    <Image
      src={firstImage}
      alt={property.title}
      fill
      className="object-cover group-hover:scale-105 transition duration-300"
    />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <span className="text-3xl">🏠</span>
    </div>
  )}
  <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[property.status]}`}>
    {property.status.charAt(0) + property.status.slice(1).toLowerCase()}
  </span>
</div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-base leading-snug">
          {property.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {property.location}
        </p>

        {/* Rent */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-xl font-bold text-gray-900">
              KES {Number(property.rentAmount).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 ml-1">/month</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {property.status === "AVAILABLE" ? (
            <Link
              href={`/properties/${property.id}`}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
            >
              Request to Rent
            </Link>
          ) : (
            <button
              disabled
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
            >
              Not Available
            </button>
          )}
        </div>
      </div>
    </div>
  );
}