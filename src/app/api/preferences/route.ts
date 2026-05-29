import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";


// GET: Get user preferences
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.preferences || {
      emailNotifications: true,
      pushNotifications: true,
      favoriteCategories: [],
      favoriteSuburbs: [],
      notificationFrequency: "daily",
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

// PUT: Update user preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      emailNotifications,
      pushNotifications,
      favoriteCategories,
      favoriteSuburbs,
      notificationFrequency,
    } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update or create preferences
    const updatedPreferences = await prisma.userPreference.upsert({
      where: {
        userId: user.id,
      },
      update: {
        emailNotifications: emailNotifications !== undefined ? emailNotifications : user.preferences?.emailNotifications,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : user.preferences?.pushNotifications,
        favoriteCategories: favoriteCategories !== undefined ? favoriteCategories : user.preferences?.favoriteCategories,
        favoriteSuburbs: favoriteSuburbs !== undefined ? favoriteSuburbs : user.preferences?.favoriteSuburbs,
        notificationFrequency: notificationFrequency || user.preferences?.notificationFrequency || "daily",
      },
      create: {
        userId: user.id,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
        favoriteCategories: favoriteCategories || [],
        favoriteSuburbs: favoriteSuburbs || [],
        notificationFrequency: notificationFrequency || "daily",
      },
    });

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
