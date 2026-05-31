import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const ALLOWED_ACTIONS = new Set(["view_category", "view_store", "view_discount", "smart_fetch"]);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ logged: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ logged: false });
    }

    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.userAccessLog.create({
      data: {
        userId: user.id,
        action,
        categoryId: typeof body.categoryId === "number" ? body.categoryId : undefined,
        storeId: typeof body.storeId === "number" ? body.storeId : undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          undefined,
      },
    });

    return NextResponse.json({ logged: true });
  } catch (error) {
    console.error("Access analytics error:", error);
    return NextResponse.json({ logged: false });
  }
}
