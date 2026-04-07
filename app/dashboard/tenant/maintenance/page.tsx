import { db } from "@/lib/db";
import { maintenanceRequests, bookings, properties } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SubmitMaintenanceButton from "@/components/shared/SubmitMaintenanceButton";

export const dynamic = "force-dynamic";

async function getTenantMaintenance(tenantId: string) {
  return await db
    .select({
      id: maintenanceRequests.id,
      title: maintenanceRequests.title,
      description: maintenanceRequests.description,
      priority: maintenanceRequests.priority,
      status: maintenanceRequests.status,
      createdAt: maintenanceRequests.createdAt,
      resolvedAt: maintenanceRequests.resolvedAt,
      propertyTitle: properties.title,
    })
    .from(maintenanceRequests)
    .leftJoin(bookings, eq(maintenanceRequests.bookingId, bookings.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(maintenanceRequests.tenantId, tenantId))
    .orderBy(maintenanceRequests.createdAt);
}

async function getActiveBooking(tenantId: string) {
  const result = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        eq(bookings.status, "ACTIVE")
      )
    )
    .limit(1);
  return result[0] ?? null;
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

export default async function TenantMaintenancePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [requests, activeBooking] = await Promise.all([
    getTenantMaintenance(session.user.id),
    getActiveBooking(session.user.id),
  ]);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Maintenance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {requests.length} request{requests.length === 1 ? "" : "s"} submitted
          </p>
        </div>
        {activeBooking && <SubmitMaintenanceButton />}
      </div>

      {!activeBooking && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 mb-6">
          <p className="text-sm font-medium text-yellow-700">
            You need an active tenancy to submit maintenance requests.
          </p>
        </div>
      )}

      {requests.length > 0 ? (
        <div className="flex flex-col gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900">{req.title}</p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityStyles[req.priority]}`}>
                      {req.priority.charAt(0) + req.priority.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{req.propertyTitle}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {req.description}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusStyles[req.status]}`}>
                  {req.status.replace("_", " ").charAt(0) + req.status.replace("_", " ").slice(1).toLowerCase()}
                </span>
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
            Submit a request if something needs attention in your unit.
          </p>
        </div>
      )}
    </div>
  );
}