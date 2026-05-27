import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();
const LIVE_VERIFIED_OFFER_TEXT = "Offer wording found on the store website";

// GET: Get user notifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const now = new Date();

    const [notifications, preferences] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.userPreference.findUnique({
        where: {
          userId,
        },
        select: {
          favoriteCategories: true,
        },
      }),
    ]);

    const interestCategoryIds = preferences?.favoriteCategories ?? [];
    const verifiedOfferWhere = {
      endDate: {
        gte: now,
      },
      description: {
        contains: LIVE_VERIFIED_OFFER_TEXT,
        mode: "insensitive" as const,
      },
    };

    const [interestCategories, verifiedStores, verifiedOfferCount] = interestCategoryIds.length
      ? await Promise.all([
          prisma.category.findMany({
            where: {
              id: {
                in: interestCategoryIds,
              },
            },
            select: {
              id: true,
              name: true,
            },
            orderBy: {
              name: "asc",
            },
          }),
          prisma.store.findMany({
            where: {
              categoryId: {
                in: interestCategoryIds,
              },
              discounts: {
                some: verifiedOfferWhere,
              },
            },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              discounts: {
                where: verifiedOfferWhere,
                orderBy: {
                  updatedAt: "desc",
                },
                take: 2,
              },
            },
            orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
            take: 25,
          }),
          prisma.store.count({
            where: {
              categoryId: {
                in: interestCategoryIds,
              },
              discounts: {
                some: verifiedOfferWhere,
              },
            },
          }),
        ])
      : [[], [], 0];

    return NextResponse.json({
      notifications,
      verifiedStores,
      verifiedOfferCount,
      interestCategoryIds,
      interestCategoryNames: interestCategories.map((category) => category.name),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST: Mark notification as read
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: parseInt(session.user.id)
      },
      data: {
        read: true
      }
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
