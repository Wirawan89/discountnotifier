import { NextResponse } from "next/server";
import { isFeatureEnabled, USER_STORE_DISCOVERY_FLAG } from "@/lib/feature-flags";

export async function GET() {
  try {
    const userStoreDiscoveryEnabled = await isFeatureEnabled(USER_STORE_DISCOVERY_FLAG);

    return NextResponse.json({
      userStoreDiscoveryEnabled,
    });
  } catch (error) {
    console.error("Public feature flags GET error:", error);
    return NextResponse.json({
      userStoreDiscoveryEnabled: true,
    });
  }
}
