import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../../../../lib/email";


export async function POST(request: Request) {
  try {
    const { email, password, name, suburb, favoriteCategories } = await request.json();

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
    const selectedCategoryIds = Array.isArray(favoriteCategories)
      ? favoriteCategories
          .map((categoryId) => Number(categoryId))
          .filter((categoryId) => Number.isInteger(categoryId) && categoryId > 0)
      : [];

    const validCategoryIds = selectedCategoryIds.length
      ? (
          await prisma.category.findMany({
            where: {
              id: {
                in: selectedCategoryIds,
              },
            },
            select: {
              id: true,
            },
          })
        ).map((category) => category.id)
      : [];

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
            favoriteCategories: validCategoryIds,
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
