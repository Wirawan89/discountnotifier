import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


const MEMBERSHIP_PRIORITY: Record<string, number> = {
  Platinum: 0,
  Gold: 1,
  Silver: 2,
};

export async function GET() {
  try {
    const now = new Date();

    const businesses = await prisma.business.findMany({
      where: {
        status: "active",
        promotionStartDate: {
          lte: now,
        },
        promotionEndDate: {
          gte: now,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            url: true,
            suburb: true,
            country: true,
          },
        },
      },
    });

    const prioritizedPromotions = businesses
      .sort((a, b) => {
        const membershipDifference =
          (MEMBERSHIP_PRIORITY[a.membershipType] ?? 99) -
          (MEMBERSHIP_PRIORITY[b.membershipType] ?? 99);

        if (membershipDifference !== 0) {
          return membershipDifference;
        }

        return a.promotionEndDate.getTime() - b.promotionEndDate.getTime();
      })
      .slice(0, 24)
      .map((business) => ({
        id: business.id,
        businessName: business.businessName,
        url: business.url,
        promotionUrl: business.promotionUrl,
        suburb: business.suburb,
        country: business.country,
        category: business.category,
        store: business.store,
        promotionMessage: business.promotionMessage,
        promotionStartDate: business.promotionStartDate,
        promotionEndDate: business.promotionEndDate,
        showcaseImages: business.showcaseImages,
        aiImageTextEnabled: business.aiImageTextEnabled,
        aiImageTextPrompt: business.aiImageTextPrompt,
        membershipType: business.membershipType,
      }));

    return NextResponse.json(prioritizedPromotions);
  } catch (error) {
    console.error("Error fetching business promotions:", error);
    return NextResponse.json(
      { error: "Failed to fetch business promotions" },
      { status: 500 }
    );
  }
}
