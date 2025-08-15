import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../../../../lib/email";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, name, suburb } = await request.json();

    // Validate input
    if (!email || !password || !suburb) {
      return NextResponse.json(
        { error: "Email, password, and suburb are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        suburb,
        preferences: {
          create: {
            emailNotifications: true,
            pushNotifications: true,
            notificationFrequency: "daily"
          }
        }
      }
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to DiscountNotifier!",
        message: "Thank you for joining us. Start exploring discounts in your area!",
        type: "system"
      }
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name || user.email.split('@')[0]);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the signup if email fails
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
