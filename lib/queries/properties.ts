import { db } from "@/lib/db";
import { properties, propertyImages, rentalRequests } from "@/lib/db/schema";
import { eq, and, notInArray, sql, ilike, or } from "drizzle-orm";

export async function getAvailablePropertyIds() {
  const pendingPropertyIds = await db
    .selectDistinct({ propertyId: rentalRequests.propertyId })
    .from(rentalRequests)
    .where(eq(rentalRequests.status, "PENDING"));

  return pendingPropertyIds.map((r) => r.propertyId);
}

export async function attachImages(props: any[]) {
  return Promise.all(
    props.map(async (p) => {
      const images = await db
        .select()
        .from(propertyImages)
        .where(eq(propertyImages.propertyId, p.id))
        .limit(1);
      return { ...p, firstImage: images[0]?.url ?? null };
    })
  );
}

export function buildAvailableCondition(excludeIds: string[], search?: string) {
  return and(
    eq(properties.isPublished, true),
    eq(properties.status, "AVAILABLE"),
    excludeIds.length > 0
      ? notInArray(properties.id, excludeIds)
      : sql`true`,
    ...(search
      ? [
          or(
            ilike(properties.title, `%${search}%`),
            ilike(properties.location, `%${search}%`)
          ),
        ]
      : [])
  );
}