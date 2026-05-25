import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const prisma = new PrismaClient();

const RESET_TOKEN_PREFIX = "password-reset:";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    const rawToken = typeof token === "string" ? token.trim() : "";
    const newPassword = typeof password === "string" ? password : "";

    if (!rawToken || !newPassword) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const tokenHash = hashToken(rawToken);
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (
      !resetToken ||
      !resetToken.identifier.startsWith(RESET_TOKEN_PREFIX) ||
      resetToken.expires < new Date()
    ) {
      if (resetToken) {
        await prisma.verificationToken.delete({ where: { token: tokenHash } });
      }

      return NextResponse.json({ error: "This reset link is invalid or has expired" }, { status: 400 });
    }

    const email = resetToken.identifier.slice(RESET_TOKEN_PREFIX.length);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.verificationToken.delete({
      where: { token: tokenHash },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
