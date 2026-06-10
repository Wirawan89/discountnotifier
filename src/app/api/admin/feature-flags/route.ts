import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureFeatureFlags } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { error } = await requireAdmin();

    if (error) {
      return error;
    }

    await ensureFeatureFlags();
    const flags = await prisma.adminFeatureFlag.findMany({
      orderBy: {
        label: "asc",
      },
    });

    return NextResponse.json({ flags });
  } catch (error) {
    console.error("Admin feature flags GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireAdmin();

    if (error) {
      return error;
    }

    const body = await request.json();
    const key = String(body.key || "").trim();

    if (!key || typeof body.isEnabled !== "boolean") {
      return NextResponse.json({ error: "Feature key and enabled status are required." }, { status: 400 });
    }

    await ensureFeatureFlags();
    const flag = await prisma.adminFeatureFlag.update({
      where: { key },
      data: {
        isEnabled: body.isEnabled,
      },
    });

    return NextResponse.json({ flag });
  } catch (error) {
    console.error("Admin feature flags PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
