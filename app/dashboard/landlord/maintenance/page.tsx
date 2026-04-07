import { db } from "@/lib/db";
import { maintenanceRequests, bookings, properties, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MaintenanceStatusButton from "@/components/shared/MaintenanceStatusButton";

export const dynamic = "force-dynamic";

async function getLandlordMaintenance(landlordId: string) {
  return await db
    .select({
      id: maintenanceRequests.id,
      title: maintenanceRequests.title,
      description: maintenanceRequests.description,
      priority: maintenanceRequests.priority,
      status: maintenanceRequests.status,
      createdAt: maintenanceRequests.createdAt,
      resolvedAt: maintenanceRequests.resolvedAt,
      tenantName: users.name,
      tenantEmail: users.email,
      tenantPhone: users.phone,
      propertyTitle: properties.title,
    })
    .from(maintenanceRequests)
    .leftJoin(bookings, eq(maintenanceRequests.bookingId, bookings.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .leftJoin(users, eq(maintenanceRequests.tenantId, users.id))
    .where(eq(properties.landlordId, landlordId))
    .orderBy(maintenanceRequests.createdAt);
}

const priorityStyles: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
  URGENT: "bg-purple-100 text-purple-700",
};

const statusStyles: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-green-100 text-green-700",
};

export default async function LandlordMaintenancePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const requests = await getLandlordMaintenance(session.user.id);

  const open = requests.filter((r) => r.status === "OPEN");
  const inProgress = requests.filter((r) => r.status === "IN_PROGRESS");
  const resolved = requests.filter((r) => r.status === "RESOLVED");

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Maintenance
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {open.length} open · {inProgress.length} in progress · {resolved.length} resolved
        </p>
      </div>

      {requests.length > 0 ? (
        <div className="flex flex-col gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 ${
                req.status === "OPEN"
                  ? "border-red-100"
                  : req.status === "IN_PROGRESS"
                  ? "border-yellow-100"
                  : "border-gray-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">

                  {/* Title + badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900">{req.title}</p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityStyles[req.priority]}`}>
                      {req.priority.charAt(0) + req.priority.slice(1).toLowerCase()}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[req.status]}`}>
                      {req.status.replace("_", " ").charAt(0) + req.status.replace("_", " ").slice(1).toLowerCase()}
                    </span>
                  </div>

                  {/* Property */}
                  <p className="text-xs text-gray-400 mb-3">{req.propertyTitle}</p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {req.description}
                  </p>

                  {/* Tenant */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {req.tenantName?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs text-gray-500">{req.tenantName}</p>
                    <p className="text-xs text-gray-400">{req.tenantEmail}</p>
                  </div>
                </div>

                {/* Status updater */}
                <MaintenanceStatusButton
                  requestId={req.id}
                  currentStatus={req.status}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>
                  Submitted {new Date(req.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
                {req.resolvedAt && (
                  <span className="text-green-600">
                    Resolved {new Date(req.resolvedAt).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <p className="text-4xl mb-4">🔧</p>
          <p className="text-lg font-medium text-gray-600">No maintenance requests</p>
          <p className="text-sm mt-2">
            Requests from your tenants will appear here.
          </p>
        </div>
      )}
    </div>
  );
}