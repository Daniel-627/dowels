import Image from "next/image";
import Link from "next/link";

interface Props {
  property: {
    id: string;
    title: string;
    location: string;
    rentAmount: string;
    bedrooms: number;
    bathrooms: number;
    status: string;
  };
  firstImage: string | null;
}

export default function PropertyCardCompact({ property, firstImage }: Props) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {firstImage ? (
          <Image
            src={firstImage}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-3xl">🏠</span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-500 text-white shadow-sm">
            Available
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {property.title}
        </p>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          📍 {property.location}
        </p>
        <div className="flex items-center justify-between mt-2.5">
          <p className="text-sm font-bold text-gray-900">
            KES {Number(property.rentAmount).toLocaleString()}
            <span className="text-xs font-normal text-gray-400">/mo</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{property.bedrooms} bd</span>
            <span>·</span>
            <span>{property.bathrooms} ba</span>
          </div>
        </div>
      </div>
    </Link>
  );
}