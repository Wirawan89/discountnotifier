import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function getStartDate(range: string): Date {
  const startDate = new Date();

  switch (range) {
    case "day":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case "month":
    default:
      startDate.setDate(startDate.getDate() - 30);
      break;
  }

  return startDate;
}

function getBucket(date: Date, range: string): string {
  if (range === "year") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  return date.toISOString().slice(0, 10);
}

function buildSeries(
  logs: Array<{ createdAt: Date; categoryId: number | null; category?: { name: string } | null }>,
  range: string
) {
  const buckets = new Map<string, Map<string, number>>();

  for (const log of logs) {
    const categoryName = log.category?.name || "Unknown";
    const bucket = getBucket(log.createdAt, range);
    const categoryCounts = buckets.get(bucket) || new Map<string, number>();
    categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
    buckets.set(bucket, categoryCounts);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, categoryCounts]) => ({
      bucket,
      categories: Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    }));
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "month";
    const startDate = getStartDate(range);
    const now = new Date();

    const [
      categories,
      preferences,
      categoryVisitGroups,
      storeVisitGroups,
      categoryTrendLogs,
      promotionCreated,
      promotionUpdated,
      summary,
    ] = await Promise.all([
      prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.userPreference.findMany({ select: { favoriteCategories: true } }),
      prisma.userAccessLog.groupBy({
        by: ["categoryId"],
        where: {
          action: "view_category",
          createdAt: { gte: startDate, lte: now },
          categoryId: { not: null },
        },
        _count: { id: true },
      }),
      prisma.userAccessLog.groupBy({
        by: ["storeId"],
        where: {
          action: "view_store",
          createdAt: { gte: startDate, lte: now },
          storeId: { not: null },
        },
        _count: { id: true },
      }),
      prisma.userAccessLog.findMany({
        where: {
          action: "view_category",
          createdAt: { gte: startDate, lte: now },
          categoryId: { not: null },
        },
        select: {
          createdAt: true,
          categoryId: true,
          category: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.promotion.count({
        where: {
          source: "business",
          createdAt: { gte: startDate, lte: now },
        },
      }),
      prisma.promotion.count({
        where: {
          source: "business",
          updatedAt: { gte: startDate, lte: now },
        },
      }),
      Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.store.count(),
        prisma.discount.count({ where: { endDate: { gte: now } } }),
        prisma.userAccessLog.count({ where: { createdAt: { gte: startDate, lte: now } } }),
      ]),
    ]);

    const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
    const favoriteCounts = new Map<number, number>();

    for (const preference of preferences) {
      for (const categoryId of preference.favoriteCategories || []) {
        favoriteCounts.set(categoryId, (favoriteCounts.get(categoryId) || 0) + 1);
      }
    }

    const favoriteCategories = Array.from(favoriteCounts.entries())
      .map(([categoryId, count]) => ({
        categoryId,
        category: categoryNameById.get(categoryId) || "Unknown",
        members: count,
      }))
      .sort((a, b) => b.members - a.members)
      .slice(0, 12);

    const categoryVisits = categoryVisitGroups
      .map((group) => ({
        categoryId: group.categoryId,
        category: group.categoryId ? categoryNameById.get(group.categoryId) || "Unknown" : "Unknown",
        visits: group._count.id,
      }))
      .sort((a, b) => b.visits - a.visits);

    const storeIds = storeVisitGroups
      .map((group) => group.storeId)
      .filter((storeId): storeId is number => typeof storeId === "number");
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: {
        id: true,
        name: true,
        suburb: true,
        city: true,
        category: { select: { name: true } },
      },
    });
    const storeById = new Map(stores.map((store) => [store.id, store]));
    const storeVisits = storeVisitGroups
      .map((group) => {
        const store = group.storeId ? storeById.get(group.storeId) : undefined;
        return {
          storeId: group.storeId,
          store: store?.name || "Unknown",
          suburb: store?.suburb || "",
          city: store?.city || "",
          category: store?.category.name || "Unknown",
          visits: group._count.id,
        };
      })
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 50);

    const [totalUsers, totalBusinesses, totalStores, activeDiscounts, totalAccess] = summary;
    const days = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / DAY_MS));

    return NextResponse.json({
      range,
      summary: {
        totalUsers,
        totalBusinesses,
        totalStores,
        activeDiscounts,
        totalAccess,
        averageDailyVisits: Math.round(totalAccess / days),
      },
      favoriteCategories,
      categoryVisits,
      storeVisits,
      categoryTrend: buildSeries(categoryTrendLogs, range),
      businessPromotionUsage: {
        created: promotionCreated,
        updated: promotionUpdated,
        totalActivity: promotionCreated + promotionUpdated,
      },
    });
  } catch (error) {
    console.error("Admin monitoring error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
