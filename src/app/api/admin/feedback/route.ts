import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const feedback = await prisma.feedback.findMany({
      where: status && status !== "all" ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const counts = await prisma.feedback.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    return NextResponse.json({
      feedback,
      counts: counts.map((item) => ({ status: item.status, count: item._count.id })),
    });
  } catch (error) {
    console.error("Admin feedback GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const id = Number(body.id);
    const status = String(body.status || "");

    if (!id || !["new", "reviewing", "resolved", "archived"].includes(status)) {
      return NextResponse.json({ error: "Valid feedback ID and status are required" }, { status: 400 });
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Admin feedback PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
