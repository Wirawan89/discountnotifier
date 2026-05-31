import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPECIFIC_SUBURBS = new Set([
  "acton",
  "adelaide",
  "alexandria",
  "artarmon",
  "ashfield",
  "bankstown",
  "belconnen",
  "bondi beach",
  "braddon",
  "brisbane city",
  "broadbeach",
  "brunswick east",
  "burleigh heads",
  "burwood",
  "cabramatta",
  "canberra city",
  "canley vale",
  "carlton",
  "chatswood",
  "chippendale",
  "chirn park",
  "collingwood",
  "cottesloe",
  "darlinghurst",
  "darwin city",
  "deakin",
  "dickson",
  "fairfield",
  "fitzroy",
  "footscray",
  "fortitude valley",
  "fremantle",
  "haymarket",
  "highgate",
  "hobart",
  "hurstville",
  "liverpool",
  "marrickville",
  "newtown",
  "north sydney",
  "northbridge",
  "parramatta",
  "perth",
  "potts point",
  "pyrmont",
  "redfern",
  "richmond",
  "rosebery",
  "salamanca",
  "strathfield",
  "surry hills",
  "ultimo",
  "unley",
  "west end",
  "west leederville",
  "west perth",
  "woolloongabba",
]);

const GENERIC_CITY_LOCATIONS = new Set([
  "adelaide",
  "brisbane",
  "canberra",
  "darwin",
  "gold coast",
  "hobart",
  "melbourne",
  "perth",
  "sydney",
]);

const ONLINE_SIGNALS = [
  "australia",
  "australian",
  "online",
  "offers",
  "deals",
  "specials",
  "store",
  "official",
  "national",
  "travel",
  "airlines",
  "airways",
];

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function inferLocationSource(store: {
  name: string;
  suburb: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  locationSource: string | null;
}) {
  if (store.latitude !== null && store.longitude !== null) {
    return store.locationSource || "exact";
  }

  const suburb = normalize(store.suburb);
  const city = normalize(store.city);
  const name = normalize(store.name);

  if (suburb && city && suburb === city && GENERIC_CITY_LOCATIONS.has(suburb)) {
    const looksOnline = ONLINE_SIGNALS.some((signal) => name.includes(signal));

    return looksOnline ? "online" : "city";
  }

  if (SPECIFIC_SUBURBS.has(suburb)) {
    return "suburb";
  }

  return store.locationSource || "unknown";
}

async function main() {
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      suburb: true,
      city: true,
      latitude: true,
      longitude: true,
      locationSource: true,
    },
  });

  const counts: Record<string, number> = {};

  for (const store of stores) {
    const locationSource = inferLocationSource(store);
    counts[locationSource] = (counts[locationSource] || 0) + 1;

    if (store.locationSource !== locationSource) {
      await prisma.store.update({
        where: { id: store.id },
        data: { locationSource },
      });
    }
  }

  console.log(JSON.stringify({ updatedStores: stores.length, counts }, null, 2));
}

main()
  .catch((error) => {
    console.error("Failed to backfill store location sources:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
