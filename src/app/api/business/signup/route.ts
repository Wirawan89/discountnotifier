import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const MAX_PROMOTION_MESSAGE_LENGTH = 96;
const MAX_SHOWCASE_PAYLOAD_BYTES = 1_500_000;
const MEMBERSHIP_TYPES = new Set(["Platinum", "Gold", "Silver"]);
const MEMBERSHIP_PRIORITY: Record<string, number> = {
  Platinum: 0,
  Gold: 1,
  Silver: 2,
};
const SHARED_DIRECTORY_DOMAINS = new Set([
  "westfield.com.au",
  "stockland.com.au",
  "qicre.com",
  "vicinity.com.au",
  "scentregroup.com",
  "dexus.com",
  "meriton.com.au",
  "cabramattaplaza.com.au",
  "duttonplaza.com.au",
  "marrickvillemetro.com.au",
  "burwoodplaza.com.au",
  "villageplaza.com.au",
  "canberraoutlet.com.au",
]);

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

function normalizeOptionalUrl(value: unknown) {
  const rawUrl = String(value || "").trim();
  if (!rawUrl) {
    return null;
  }

  return /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

function getDomain(value: string) {
  try {
    return new URL(normalizeBusinessUrl(value)).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch (_error) {
    return "";
  }
}

function normalizeComparableUrl(value: string) {
  try {
    const url = new URL(normalizeBusinessUrl(value));
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    return `${hostname}${pathname}`.toLowerCase();
  } catch (_error) {
    return "";
  }
}

function normalizeName(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(pty|ltd|limited|australia|australian|store|stores|shop|official)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeLocation(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function tokenOverlapScore(inputName: string, storeName: string) {
  const inputTokens = new Set(
    normalizeName(inputName)
      .split(/\s+/)
      .filter((token) => token.length >= 3)
  );
  const storeTokens = new Set(
    normalizeName(storeName)
      .split(/\s+/)
      .filter((token) => token.length >= 3)
  );

  if (inputTokens.size === 0 || storeTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of inputTokens) {
    if (storeTokens.has(token)) {
      overlap++;
    }
  }

  return Math.round((overlap / Math.max(inputTokens.size, storeTokens.size)) * 45);
}

function getStoreIdentityConflictReason({
  inputUrl,
  storeUrl,
  inputName,
  storeName,
  inputSuburb,
  storeSuburb,
  storeCity,
}: {
  inputUrl: string;
  storeUrl: string;
  inputName: string;
  storeName: string;
  inputSuburb: string;
  storeSuburb: string;
  storeCity: string;
}) {
  const inputDomain = getDomain(inputUrl);
  const storeDomain = getDomain(storeUrl);
  const isSameDomain = Boolean(inputDomain && storeDomain && inputDomain === storeDomain);

  if (!isSameDomain) {
    return null;
  }

  const isSameFullUrl = normalizeComparableUrl(inputUrl) === normalizeComparableUrl(storeUrl);
  if (isSameFullUrl) {
    return "same website URL";
  }

  const isSharedDomain = SHARED_DIRECTORY_DOMAINS.has(storeDomain);
  if (!isSharedDomain) {
    return "same website domain";
  }

  const sameLocation =
    normalizeLocation(inputSuburb) &&
    (normalizeLocation(inputSuburb) === normalizeLocation(storeSuburb) ||
      normalizeLocation(inputSuburb) === normalizeLocation(storeCity));
  const nameScore = tokenOverlapScore(inputName, storeName);

  return sameLocation && nameScore >= 25
    ? "same shared directory domain, similar name, and same suburb"
    : null;
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
    ];

    const missingField = requiredFields.find((field) => !data[field]);
    if (missingField) {
      return NextResponse.json(
        { error: `${missingField} is required` },
        { status: 400 }
      );
    }

    const promotionMessage = String(data.promotionMessage || "").trim();
    if (promotionMessage.length > MAX_PROMOTION_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Promotion Message must be 96 characters or less" },
        { status: 400 }
      );
    }

    const dob = normalizeDate(data.dob);
    const promotionStartDate = normalizeDate(data.promotionStartDate);
    const promotionEndDate = normalizeDate(data.promotionEndDate);
    const hasPromotionInput = Boolean(
      promotionMessage ||
      data.promotionStartDate ||
      data.promotionEndDate ||
      data.promotionUrl
    );

    if (!dob) {
      return NextResponse.json(
        { error: "DOB must be a valid date" },
        { status: 400 }
      );
    }

    if (hasPromotionInput && (!promotionMessage || !promotionStartDate || !promotionEndDate)) {
      return NextResponse.json(
        { error: "To publish a promotion, enter Promotion Message, From date, and To date." },
        { status: 400 }
      );
    }

    if (promotionStartDate && promotionEndDate && promotionEndDate < promotionStartDate) {
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
    const promotionUrl = normalizeOptionalUrl(data.promotionUrl);
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

    const existingBusinessUrl = await prisma.business.findUnique({
      where: {
        url: normalizedUrl,
      },
    });

    if (existingBusinessUrl) {
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

    const claimedStoreId = Number(data.claimedStoreId || 0);
    const claimedStore = claimedStoreId > 0
      ? await prisma.store.findUnique({
          where: {
            id: claimedStoreId,
          },
          include: {
            business: true,
          },
        })
      : null;

    if (claimedStoreId > 0 && !claimedStore) {
      return NextResponse.json(
        { error: "Selected store could not be found. Please search again." },
        { status: 400 }
      );
    }

    if (claimedStore?.business) {
      return NextResponse.json(
        { error: "This store has already been claimed by another business account." },
        { status: 400 }
      );
    }

    const businessName = String(data.businessName).trim();
    const suburb = String(data.suburb).trim();
    const country = String(data.country).trim();
    const address = String(data.address).trim();
    const candidateStores = await prisma.store.findMany({
      where: {
        country: {
          in: country === "Australia" ? ["Australia", ""] : [country],
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 2500,
    });
    const identityConflict = candidateStores
      .filter((store) => store.id !== claimedStore?.id)
      .map((store) => ({
        store,
        reason: getStoreIdentityConflictReason({
          inputUrl: normalizedUrl,
          storeUrl: store.url,
          inputName: businessName,
          storeName: store.name,
          inputSuburb: suburb,
          storeSuburb: store.suburb,
          storeCity: store.city,
        }),
      }))
      .find((match) => match.reason);

    if (!claimedStore && identityConflict) {
      const conflictStore = identityConflict.store;
      return NextResponse.json(
        {
          error:
            "This business website already exists in DiscountNotifier. Please use the matching store claim option instead of creating a duplicate.",
          existingStore: {
            id: conflictStore.id,
            name: conflictStore.name,
            url: conflictStore.url,
            suburb: conflictStore.suburb,
            city: conflictStore.city,
            categoryId: conflictStore.categoryId,
            categoryName: conflictStore.category.name,
            matchReason: identityConflict.reason,
          },
        },
        { status: 409 }
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
    const effectiveCategoryId = claimedStore?.categoryId || categoryId;
    const promotionPriority = MEMBERSHIP_PRIORITY[membershipType] ?? 2;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: `${String(data.firstName).trim()} ${String(data.lastName).trim()}`,
          suburb,
          role: "business",
          preferences: {
            create: {
              emailNotifications: true,
              pushNotifications: true,
              favoriteCategories: [effectiveCategoryId],
              notificationFrequency: "daily",
            },
          },
        },
      });

      const store = claimedStore
        ? await tx.store.update({
            where: {
              id: claimedStore.id,
            },
            data: {
              name: businessName,
              suburb,
              city: suburb,
              country,
              address,
              description: promotionMessage ? `Business submitted promotion: ${promotionMessage}` : claimedStore.description,
              background: showcaseImages[0] || claimedStore.background,
              ownerId: user.id,
            },
          })
        : await tx.store.create({
            data: {
              name: businessName,
              url: normalizedUrl,
              suburb,
              city: suburb,
              country,
              address,
              description: promotionMessage ? `Business submitted promotion: ${promotionMessage}` : null,
              catalogs: [],
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
          businessName,
          address,
          suburb,
          state: String(data.state).trim(),
          country,
          abn: data.abn ? String(data.abn).trim() : null,
          url: normalizedUrl,
          categoryId: store.categoryId,
          promotionUrl,
          promotionMessage,
          promotionStartDate: promotionStartDate || new Date(),
          promotionEndDate: promotionEndDate || new Date(),
          showcaseImages,
          aiImageTextEnabled: Boolean(data.aiImageTextEnabled),
          aiImageTextPrompt: data.aiImageTextPrompt ? String(data.aiImageTextPrompt).trim() : null,
          membershipType,
          status: "active",
          verificationStatus: claimedStore ? "claimed_pending" : "pending",
          subscriptionStatus: "trial",
        },
      });

      if (hasPromotionInput && promotionStartDate && promotionEndDate) {
        await tx.promotion.create({
          data: {
            businessId: business.id,
            storeId: store.id,
            message: promotionMessage,
            url: promotionUrl,
            startDate: promotionStartDate,
            endDate: promotionEndDate,
            priority: promotionPriority,
            status: "active",
            source: claimedStore ? "business_claim" : "business",
          },
        });

        await tx.discount.create({
          data: {
            storeId: store.id,
            title: promotionMessage,
            description: `Business promotion submitted by ${String(data.businessName).trim()}`,
            startDate: promotionStartDate,
            endDate: promotionEndDate,
            eCatalog: promotionUrl ? [promotionUrl] : showcaseImages,
          },
        });
      }

      if (hasPromotionInput && promotionStartDate && promotionEndDate) {
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
      }

      return { user, store, business };
    });

    return NextResponse.json(
      {
        message: "Business account created successfully",
        userId: result.user.id,
        businessId: result.business.id,
        storeId: result.store.id,
        claimedExistingStore: Boolean(claimedStore),
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
