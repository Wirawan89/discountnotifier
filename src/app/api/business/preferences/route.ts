import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

const MAX_PROMOTION_MESSAGE_LENGTH = 96;
const MAX_SHOWCASE_PAYLOAD_BYTES = 1_500_000;
const PROMOTION_SCHEDULE_TYPES = new Set(["one_off", "daily", "weekly", "monthly"]);

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function cleanImages(images: unknown) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((image): image is string => typeof image === "string" && image.startsWith("data:image/"))
    .slice(0, 6);
}

function normalizeOptionalUrl(value: unknown) {
  const rawUrl = String(value || "").trim();
  if (!rawUrl) {
    return null;
  }

  return /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

function normalizePromotionScheduleType(value: unknown) {
  const scheduleType = String(value || "one_off").trim();
  return PROMOTION_SCHEDULE_TYPES.has(scheduleType) ? scheduleType : "one_off";
}

function normalizeNumberList(value: unknown, min: number, max: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= min && item <= max)
    )
  ).sort((a, b) => a - b);
}

async function getBusinessForSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      business: {
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
              catalogs: true,
              background: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  if (!user.business) {
    return { error: NextResponse.json({ error: "Business profile not found" }, { status: 404 }) };
  }

  return { user, business: user.business };
}

export async function GET() {
  try {
    const result = await getBusinessForSession();

    if ("error" in result) {
      return result.error;
    }

    const { business } = result;

    return NextResponse.json({
      id: business.id,
      storeId: business.storeId,
      businessName: business.businessName,
      url: business.url,
      category: business.category,
      store: business.store,
      promotionMessage: business.promotionMessage,
      promotionUrl: business.promotionUrl ?? "",
      promotionScheduleType: business.promotionScheduleType,
      promotionWeeklyDays: business.promotionWeeklyDays,
      promotionMonthlyWeeks: business.promotionMonthlyWeeks,
      promotionStartDate: formatDateInput(business.promotionStartDate),
      promotionEndDate: formatDateInput(business.promotionEndDate),
      showcaseImages: business.showcaseImages,
      aiImageTextEnabled: business.aiImageTextEnabled,
      aiImageTextPrompt: business.aiImageTextPrompt ?? "",
      membershipType: business.membershipType,
      status: business.status,
      verificationStatus: business.verificationStatus,
      subscriptionStatus: business.subscriptionStatus,
    });
  } catch (error) {
    console.error("Error fetching business preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch business preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const result = await getBusinessForSession();

    if ("error" in result) {
      return result.error;
    }

    const { business } = result;
    const data = await request.json();
    const promotionMessage = String(data.promotionMessage || "").trim();
    const promotionUrl = normalizeOptionalUrl(data.promotionUrl);
    const promotionScheduleType = normalizePromotionScheduleType(data.promotionScheduleType);
    const promotionWeeklyDays = normalizeNumberList(data.promotionWeeklyDays, 1, 7);
    const promotionMonthlyWeeks = normalizeNumberList(data.promotionMonthlyWeeks, 1, 4);
    const promotionStartDate = normalizeDate(data.promotionStartDate);
    const promotionEndDate = normalizeDate(data.promotionEndDate);
    const showcaseImages = cleanImages(data.showcaseImages);
    const showcasePayloadBytes = Buffer.byteLength(showcaseImages.join(""), "utf8");
    const hasPromotionInput = Boolean(
      promotionMessage ||
      data.promotionUrl ||
      data.promotionStartDate ||
      data.promotionEndDate ||
      promotionScheduleType !== "one_off" ||
      promotionWeeklyDays.length > 0 ||
      promotionMonthlyWeeks.length > 0
    );

    if (hasPromotionInput && !promotionMessage) {
      return NextResponse.json(
        { error: "Promotion Message is required when publishing or scheduling a promotion." },
        { status: 400 }
      );
    }

    if (promotionMessage.length > MAX_PROMOTION_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Promotion Message must be 96 characters or less" },
        { status: 400 }
      );
    }

    if (hasPromotionInput && (!promotionStartDate || !promotionEndDate)) {
      return NextResponse.json(
        { error: "Promotion dates must be valid dates when publishing or scheduling a promotion." },
        { status: 400 }
      );
    }

    if (promotionStartDate && promotionEndDate && promotionEndDate < promotionStartDate) {
      return NextResponse.json(
        { error: "Promotion end date must be after the start date" },
        { status: 400 }
      );
    }

    if (promotionScheduleType === "weekly" && promotionWeeklyDays.length === 0) {
      return NextResponse.json(
        { error: "Select at least one weekday for a weekly promotion schedule." },
        { status: 400 }
      );
    }

    if (promotionScheduleType === "monthly" && promotionMonthlyWeeks.length === 0) {
      return NextResponse.json(
        { error: "Select at least one week for a monthly promotion schedule." },
        { status: 400 }
      );
    }

    if (promotionUrl) {
      try {
        const parsedPromotionUrl = new URL(promotionUrl);
        if (!["http:", "https:"].includes(parsedPromotionUrl.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch (_error) {
        return NextResponse.json(
          { error: "Promotion URL must be a valid website URL" },
          { status: 400 }
        );
      }
    }

    if (showcasePayloadBytes > MAX_SHOWCASE_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Showcase images are too large. Please upload smaller images or fewer images." },
        { status: 400 }
      );
    }

    const updatedBusiness = await prisma.$transaction(async (tx) => {
      const savedBusiness = await tx.business.update({
        where: {
          id: business.id,
        },
        data: {
          promotionMessage,
          promotionUrl,
          promotionScheduleType,
          promotionWeeklyDays,
          promotionMonthlyWeeks,
          promotionStartDate: promotionStartDate || new Date(),
          promotionEndDate: promotionEndDate || new Date(),
          showcaseImages,
          aiImageTextEnabled: Boolean(data.aiImageTextEnabled),
          aiImageTextPrompt: data.aiImageTextPrompt ? String(data.aiImageTextPrompt).trim() : null,
        },
      });

      if (business.storeId) {
        await tx.store.update({
          where: {
            id: business.storeId,
          },
          data: {
            background: showcaseImages[0] || null,
            description: `Business submitted promotion: ${promotionMessage}`,
          },
        });

        const existingPromotion = await tx.promotion.findFirst({
          where: {
            businessId: business.id,
            storeId: business.storeId,
            source: {
              startsWith: "business",
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (!hasPromotionInput) {
          await tx.promotion.updateMany({
            where: {
              businessId: business.id,
              storeId: business.storeId,
              source: {
                startsWith: "business",
              },
            },
            data: {
              status: "inactive",
            },
          });
        } else if (existingPromotion && promotionStartDate && promotionEndDate) {
          await tx.promotion.update({
            where: {
              id: existingPromotion.id,
            },
            data: {
              message: promotionMessage,
              url: promotionUrl,
              scheduleType: promotionScheduleType,
              weeklyDays: promotionWeeklyDays,
              monthlyWeeks: promotionMonthlyWeeks,
              startDate: promotionStartDate,
              endDate: promotionEndDate,
              status: "active",
            },
          });
        } else if (promotionStartDate && promotionEndDate) {
          await tx.promotion.create({
            data: {
              businessId: business.id,
              storeId: business.storeId,
              message: promotionMessage,
              url: promotionUrl,
              scheduleType: promotionScheduleType,
              weeklyDays: promotionWeeklyDays,
              monthlyWeeks: promotionMonthlyWeeks,
              startDate: promotionStartDate,
              endDate: promotionEndDate,
              priority:
                business.membershipType === "Platinum"
                  ? 0
                  : business.membershipType === "Gold"
                    ? 1
                    : 2,
              status: "active",
              source: "business",
            },
          });
        }

        const existingDiscount = await tx.discount.findFirst({
          where: {
            storeId: business.storeId,
            description: {
              startsWith: "Business promotion submitted",
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (!hasPromotionInput) {
          await tx.discount.deleteMany({
            where: {
              storeId: business.storeId,
              description: {
                startsWith: "Business promotion submitted",
              },
            },
          });
        } else if (existingDiscount && promotionStartDate && promotionEndDate) {
          await tx.discount.update({
            where: {
              id: existingDiscount.id,
            },
            data: {
              title: promotionMessage,
              description: `Business promotion submitted by ${business.businessName}`,
              startDate: promotionStartDate,
              endDate: promotionEndDate,
              eCatalog: promotionUrl ? [promotionUrl] : showcaseImages,
            },
          });
        } else if (promotionStartDate && promotionEndDate) {
          await tx.discount.create({
            data: {
              storeId: business.storeId,
              title: promotionMessage,
              description: `Business promotion submitted by ${business.businessName}`,
              startDate: promotionStartDate,
              endDate: promotionEndDate,
              eCatalog: promotionUrl ? [promotionUrl] : showcaseImages,
            },
          });
        }

        await tx.showcase.deleteMany({
          where: {
            storeId: business.storeId,
          },
        });

        if (promotionStartDate && promotionEndDate) {
          await Promise.all(
            showcaseImages.map((_, index) =>
              tx.showcase.create({
                data: {
                  storeId: business.storeId as number,
                  window: index + 1,
                  startDate: promotionStartDate,
                  endDate: promotionEndDate,
                },
              })
            )
          );
        }
      }

      return savedBusiness;
    });

    return NextResponse.json({
      id: updatedBusiness.id,
      promotionMessage: updatedBusiness.promotionMessage,
      promotionUrl: updatedBusiness.promotionUrl ?? "",
      promotionScheduleType: updatedBusiness.promotionScheduleType,
      promotionWeeklyDays: updatedBusiness.promotionWeeklyDays,
      promotionMonthlyWeeks: updatedBusiness.promotionMonthlyWeeks,
      promotionStartDate: formatDateInput(updatedBusiness.promotionStartDate),
      promotionEndDate: formatDateInput(updatedBusiness.promotionEndDate),
      showcaseImages: updatedBusiness.showcaseImages,
      aiImageTextEnabled: updatedBusiness.aiImageTextEnabled,
      aiImageTextPrompt: updatedBusiness.aiImageTextPrompt ?? "",
    });
  } catch (error) {
    console.error("Error updating business preferences:", error);
    return NextResponse.json(
      { error: "Failed to update business preferences" },
      { status: 500 }
    );
  }
}
