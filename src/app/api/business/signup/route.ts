import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const MAX_PROMOTION_MESSAGE_LENGTH = 96;
const MAX_SHOWCASE_PAYLOAD_BYTES = 1_500_000;
const MEMBERSHIP_TYPES = new Set(["Platinum", "Gold", "Silver"]);

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanImages(images: unknown) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((image): image is string => typeof image === "string" && image.startsWith("data:image/"))
    .slice(0, 6);
}

function normalizeBusinessUrl(value: unknown) {
  const rawUrl = String(value || "").trim();
  if (!rawUrl) {
    return "";
  }

  return /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

export async function POST(request: Request) {
  let data: Record<string, unknown>;

  try {
    data = await request.json();
  } catch (error) {
    console.error("Business signup JSON parse error:", error);
    return NextResponse.json(
      { error: "Business signup data could not be read. Try smaller showcase images." },
      { status: 400 }
    );
  }

  try {
    if (data.robotVerified !== true) {
      return NextResponse.json(
        { error: "Please complete the I'm not a robot verification" },
        { status: 400 }
      );
    }

    const requiredFields = [
      "email",
      "password",
      "firstName",
      "lastName",
      "dob",
      "businessName",
      "address",
      "suburb",
      "state",
      "country",
      "url",
      "categoryId",
      "promotionMessage",
      "promotionStartDate",
      "promotionEndDate",
    ];

    const missingField = requiredFields.find((field) => !data[field]);
    if (missingField) {
      return NextResponse.json(
        { error: `${missingField} is required` },
        { status: 400 }
      );
    }

    const promotionMessage = String(data.promotionMessage).trim();
    if (promotionMessage.length > MAX_PROMOTION_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Promotion Message must be 96 characters or less" },
        { status: 400 }
      );
    }

    const dob = normalizeDate(data.dob);
    const promotionStartDate = normalizeDate(data.promotionStartDate);
    const promotionEndDate = normalizeDate(data.promotionEndDate);

    if (!dob || !promotionStartDate || !promotionEndDate) {
      return NextResponse.json(
        { error: "DOB and promotion dates must be valid dates" },
        { status: 400 }
      );
    }

    if (promotionEndDate < promotionStartDate) {
      return NextResponse.json(
        { error: "Promotion end date must be after the start date" },
        { status: 400 }
      );
    }

    const categoryId = Number(data.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { error: "Business Category is required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: String(data.email).trim().toLowerCase(),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account already exists with this email" },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeBusinessUrl(data.url);
    try {
      const parsedUrl = new URL(normalizedUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch (_error) {
      return NextResponse.json(
        { error: "Business URL must be a valid website URL" },
        { status: 400 }
      );
    }

    const [existingBusinessUrl, existingStoreUrl] = await Promise.all([
      prisma.business.findUnique({
        where: {
          url: normalizedUrl,
        },
      }),
      prisma.store.findUnique({
        where: {
          url: normalizedUrl,
        },
      }),
    ]);

    if (existingBusinessUrl || existingStoreUrl) {
      return NextResponse.json(
        { error: "A business already exists with this URL" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Business Category was not found" },
        { status: 400 }
      );
    }

    const requestedMembershipType = String(data.membershipType || "Silver");
    const membershipType = MEMBERSHIP_TYPES.has(requestedMembershipType)
      ? requestedMembershipType
      : "Silver";
    const showcaseImages = cleanImages(data.showcaseImages);
    const showcasePayloadBytes = Buffer.byteLength(showcaseImages.join(""), "utf8");
    if (showcasePayloadBytes > MAX_SHOWCASE_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Showcase images are too large. Please upload smaller images or fewer images." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(String(data.password), 12);
    const normalizedEmail = String(data.email).trim().toLowerCase();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: `${String(data.firstName).trim()} ${String(data.lastName).trim()}`,
          suburb: String(data.suburb).trim(),
          role: "business",
          preferences: {
            create: {
              emailNotifications: true,
              pushNotifications: true,
              favoriteCategories: [categoryId],
              notificationFrequency: "daily",
            },
          },
        },
      });

      const store = await tx.store.create({
        data: {
          name: String(data.businessName).trim(),
          url: normalizedUrl,
          suburb: String(data.suburb).trim(),
          city: String(data.suburb).trim(),
          country: String(data.country).trim(),
          address: String(data.address).trim(),
          description: `Business submitted promotion: ${promotionMessage}`,
          catalogs: showcaseImages,
          background: showcaseImages[0] || null,
          categoryId,
          ownerId: user.id,
        },
      });

      const business = await tx.business.create({
        data: {
          userId: user.id,
          storeId: store.id,
          firstName: String(data.firstName).trim(),
          lastName: String(data.lastName).trim(),
          dob,
          businessName: String(data.businessName).trim(),
          address: String(data.address).trim(),
          suburb: String(data.suburb).trim(),
          state: String(data.state).trim(),
          country: String(data.country).trim(),
          url: normalizedUrl,
          categoryId,
          promotionMessage,
          promotionStartDate,
          promotionEndDate,
          showcaseImages,
          aiImageTextEnabled: Boolean(data.aiImageTextEnabled),
          aiImageTextPrompt: data.aiImageTextPrompt ? String(data.aiImageTextPrompt).trim() : null,
          membershipType,
          status: "active",
        },
      });

      await tx.discount.create({
        data: {
          storeId: store.id,
          title: promotionMessage,
          description: `Business promotion submitted by ${String(data.businessName).trim()}`,
          startDate: promotionStartDate,
          endDate: promotionEndDate,
          eCatalog: showcaseImages,
        },
      });

      await Promise.all(
        showcaseImages.map((_, index) =>
          tx.showcase.create({
            data: {
              storeId: store.id,
              window: index + 1,
              startDate: promotionStartDate,
              endDate: promotionEndDate,
            },
          })
        )
      );

      return { user, store, business };
    });

    return NextResponse.json(
      {
        message: "Business account created successfully",
        userId: result.user.id,
        businessId: result.business.id,
        storeId: result.store.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Business signup error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A business account, store URL, or promotion with these details already exists." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create business account" },
      { status: 500 }
    );
  }
}
