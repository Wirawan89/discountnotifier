import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled, USER_STORE_DISCOVERY_FLAG } from "@/lib/feature-flags";

export const runtime = "nodejs";

const supportedCategories = new Set([
  "Baby & Kids",
  "Books & Magazines",
  "Business Attire",
  "Camera & Gears",
  "Cars Accessories",
  "Clothing & Fashions",
  "Cosmetic & Perfumes",
  "Electronic & Gadgets",
  "Factory Outlets",
  "Food & Groceries",
  "Gifts & Flowers",
  "HIFI Audio & Speakers",
  "Home & Garden",
  "Leather Jackets & Bags",
  "Luxury & Designer",
  "Music Gears",
  "Office & Stationary",
  "Pets Supplies",
  "Sport Gears",
  "Tools & DIY",
  "Travelling Accessories",
  "Trending Toys",
  "Vitamin & Supplier",
]);

function normalizeCategory(value: unknown) {
  const categoryName = String(value || "").trim();
  return supportedCategories.has(categoryName) ? categoryName : "";
}

function normalizeStoreName(value: unknown) {
  const storeName = String(value || "")
    .replace(/[^\p{L}\p{N}&.'’\-\s()]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (storeName.length < 2 || storeName.length > 80) {
    return "";
  }

  return storeName;
}

function searchableStoreName(value: string) {
  return value
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:shoe|shoes|store|shop|brand|australia|sale|discount|deal|offer)s?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function storeNameTerms(value: string) {
  return searchableStoreName(value)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 4);
}

export async function POST(request: Request) {
  try {
    const discoveryEnabled = await isFeatureEnabled(USER_STORE_DISCOVERY_FLAG);

    if (!discoveryEnabled) {
      return NextResponse.json(
        { error: "Automatic store discovery is currently disabled." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const categoryName = normalizeCategory(body.categoryName);
    const storeName = normalizeStoreName(body.storeName);

    if (!categoryName) {
      return NextResponse.json({ error: "A supported category is required." }, { status: 400 });
    }

    if (!storeName) {
      return NextResponse.json({ error: "A valid store name is required." }, { status: 400 });
    }

    const terms = storeNameTerms(storeName);
    const existingStore = terms.length
      ? await prisma.store.findFirst({
          where: {
            NOT: {
              locationSource: "closed",
            },
            category: {
              name: {
                not: categoryName,
              },
            },
            AND: terms.map((term) => ({
              name: {
                contains: term,
                mode: "insensitive",
              },
            })),
          },
          select: {
            id: true,
            name: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        })
      : null;

    if (existingStore) {
      const params = new URLSearchParams({
        categoryId: String(existingStore.category.id),
        quickSearch: searchableStoreName(storeName) || storeName,
      });

      return NextResponse.json({
        foundExisting: true,
        message: `${existingStore.name} is already listed in ${existingStore.category.name}.`,
        storeName: existingStore.name,
        categoryId: existingStore.category.id,
        categoryName: existingStore.category.name,
        href: `/?${params.toString()}`,
      });
    }

    const logsDir = path.join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true });
    const logPath = path.join(logsDir, `store-discovery-${Date.now()}.log`);
    const logStream = createWriteStream(logPath, { flags: "a" });

    const child = spawn(
      "npx",
      [
        "tsx",
        "scripts/discover-store-by-name.ts",
        `--category=${categoryName}`,
        `--store=${storeName}`,
        "--country=Australia",
      ],
      {
        cwd: process.cwd(),
        env: process.env,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
      }
    );

    child.stdout.pipe(logStream);
    child.stderr.pipe(logStream);
    child.unref();

    return NextResponse.json({
      message: `Your request will be processed in background, approximately 1-2 minutes. Please re-enter "${storeName}" in Search after that.`,
      pid: child.pid,
      logPath,
    });
  } catch (error) {
    console.error("Store discovery request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
