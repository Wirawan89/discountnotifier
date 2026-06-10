import { prisma } from "@/lib/prisma";

export const USER_STORE_DISCOVERY_FLAG = "user_store_discovery";

export const DEFAULT_FEATURE_FLAGS = [
  {
    key: USER_STORE_DISCOVERY_FLAG,
    label: "Automatic Search / Discovery by User",
    description:
      "Allow users to trigger background store discovery from the category search menu when a store is not found.",
    isEnabled: false,
  },
] as const;

export type FeatureFlagKey = (typeof DEFAULT_FEATURE_FLAGS)[number]["key"];

export async function ensureFeatureFlags() {
  await Promise.all(
    DEFAULT_FEATURE_FLAGS.map((flag) =>
      prisma.adminFeatureFlag.upsert({
        where: { key: flag.key },
        update: {
          label: flag.label,
          description: flag.description,
        },
        create: flag,
      })
    )
  );
}

export async function getFeatureFlag(key: FeatureFlagKey) {
  const defaultFlag = DEFAULT_FEATURE_FLAGS.find((flag) => flag.key === key);

  if (!defaultFlag) {
    return null;
  }

  const flag = await prisma.adminFeatureFlag.upsert({
    where: { key },
    update: {
      label: defaultFlag.label,
      description: defaultFlag.description,
    },
    create: defaultFlag,
  });

  return flag;
}

export async function isFeatureEnabled(key: FeatureFlagKey) {
  const flag = await getFeatureFlag(key);
  return flag?.isEnabled ?? false;
}
