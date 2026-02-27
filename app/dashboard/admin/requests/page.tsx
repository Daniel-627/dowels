import { db } from "@/lib/db";
import { rentalRequests, users, properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import RequestActionButtons from "@/components/shared/RequestActionButtons";

async function getRequests() {
  return await db
    .select({
      id: rentalRequests.id,
      status: rentalRequests.status,
      moveInDate: rentalRequests.moveInDate,
      occupants: rentalRequests.occupants,
      employmentInfo: rentalRequests.employmentInfo,
      message: rentalRequests.message,
      createdAt: rentalRequests.createdAt,
      reviewedAt: rentalRequests.reviewedAt,
      tenantName: users.name,
      tenantEmail: users.email,
      tenantPhone: users.phone,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
      propertyRent: properties.rentAmount,
      propertyId: properties.id,
    })
    .from(rentalRequests)
    .leftJoin(users, eq(rentalRequests.tenantId, users.id))
    .leftJoin(properties, eq(rentalRequests.propertyId, properties.id))
    .orderBy(rentalRequests.createdAt);
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default async function AdminRequestsPage() {
  const requests = await getRequests();
  const pending = requests.filter((r) => r.status === "PENDING");
  const reviewed = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rental Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pending.length} pending · {reviewed.length} reviewed
        </p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Pending Review
          </h2>
          <div className="flex flex-col gap-4">
            {pending.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-yellow-100 p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">

                    {/* Property */}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {req.propertyTitle}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {req.propertyLocation} · KES {Number(req.propertyRent).toLocaleString()}/mo
                      </p>
                    </div>

                    {/* Tenant */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                        {req.tenantName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {req.tenantName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {req.tenantEmail} {req.tenantPhone ? `· ${req.tenantPhone}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Move-in Date</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          {new Date(req.moveInDate).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Occupants</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          {req.occupants} {req.occupants === 1 ? "person" : "people"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-500">Submitted</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          {new Date(req.createdAt).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Employment info */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Employment Info
                      </p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {req.employmentInfo}
                      </p>
                    </div>

                    {/* Message */}
                    {req.message && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Message
                        </p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 italic">
                          "{req.message}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <RequestActionButtons requestId={req.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Reviewed
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Move-in</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reviewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reviewed.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{req.tenantName}</p>
                      <p className="text-xs text-gray-400">{req.tenantEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700">{req.propertyTitle}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(req.moveInDate).toLocaleDateString("en-KE", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[req.status]}`}>
                        {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {req.reviewedAt
                        ? new Date(req.reviewedAt).toLocaleDateString("en-KE", {
                            day: "numeric", month: "short", year: "numeric"
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty */}
      {requests.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg font-medium">No rental requests yet</p>
          <p className="text-sm mt-2">Requests will appear here when tenants apply.</p>
        </div>
      )}
    </div>
  );
}