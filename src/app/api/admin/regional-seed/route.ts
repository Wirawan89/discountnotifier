import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const supportedCategories = new Set(["Dining & Beverages", "Food & Groceries", "Factory Outlets"]);
const supportedRegions = new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", "AU"]);

function normalizeCategory(value: unknown) {
  const categoryName = String(value || "").trim();
  return supportedCategories.has(categoryName) ? categoryName : "";
}

function normalizeRegions(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((region) => String(region).trim().toUpperCase())
    .filter((region) => supportedRegions.has(region));
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const categoryName = normalizeCategory(body.categoryName);
    const regions = normalizeRegions(body.regions);

    if (!categoryName) {
      return NextResponse.json({ error: "A supported category is required." }, { status: 400 });
    }

    const logsDir = path.join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true });
    const logPath = path.join(logsDir, `regional-seed-${Date.now()}.log`);
    const logStream = createWriteStream(logPath, { flags: "a" });

    const args = ["tsx", "scripts/run-regional-seed.ts", `--category=${categoryName}`];
    if (regions.length > 0) {
      args.push(`--regions=${regions.join(",")}`);
    }

    const child = spawn("npx", args, {
      cwd: process.cwd(),
      env: process.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    child.stdout.pipe(logStream);
    child.stderr.pipe(logStream);
    child.unref();

    return NextResponse.json({
      message: `Regional seed started for ${categoryName}${regions.length ? ` (${regions.join(", ")})` : " (all available regions)"}.`,
      pid: child.pid,
      logPath,
    });
  } catch (error) {
    console.error("Regional seed POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
