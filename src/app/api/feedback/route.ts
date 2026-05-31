import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const user = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { business: true },
        })
      : null;

    const feedback = await prisma.feedback.create({
      data: {
        senderType: user?.business ? "business" : user ? "user" : "visitor",
        name: String(body.name || session?.user?.name || "").trim() || null,
        email: String(body.email || session?.user?.email || "").trim() || null,
        subject,
        message,
        source: String(body.source || "app"),
        userId: user?.id,
        businessId: user?.business?.id,
        storeId: typeof body.storeId === "number" ? body.storeId : null,
        categoryId: typeof body.categoryId === "number" ? body.categoryId : null,
      },
    });

    return NextResponse.json({ success: true, feedbackId: feedback.id });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
