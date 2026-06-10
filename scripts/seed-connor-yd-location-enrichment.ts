import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type BranchSeed = {
  name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  latitude: number;
  longitude: number;
};

type BrandSeed = {
  parentName: string;
  url: string;
  websiteUrl: string;
  catalogs: string[];
  branches: BranchSeed[];
};

const brands: BrandSeed[] = [
  {
    parentName: "Connor Business Attire",
    url: "https://www.connor.com.au/au",
    websiteUrl: "https://www.connor.com.au/au",
    catalogs: ["https://www.connor.com.au/au/sale", "https://www.connor.com.au/au/clothing/suits"],
    branches: [
      {
        name: "Connor Eastern Creek",
        address: "Shop 3212 Eastern Creek Quarter, 159 Rooty Hill Road",
        suburb: "Eastern Creek",
        state: "NSW",
        postcode: "2766",
        latitude: -33.798,
        longitude: 150.849,
      },
      {
        name: "Connor Mt Druitt",
        address: "Shop 204 Westfield Mt Druitt, Cnr Carlisle Avenue and Luxford Road",
        suburb: "Mt Druitt",
        state: "NSW",
        postcode: "2770",
        latitude: -33.768,
        longitude: 150.819,
      },
      {
        name: "Connor Nepean",
        address: "Shop SP019 Nepean Centre, Cnr Station and Woodriff Street",
        suburb: "Penrith",
        state: "NSW",
        postcode: "2750",
        latitude: -33.751,
        longitude: 150.694,
      },
      {
        name: "Connor Wetherill Park",
        address: "Shop 20, Stockland Wetherill Park, Polding Street",
        suburb: "Wetherill Park",
        state: "NSW",
        postcode: "2164",
        latitude: -33.858,
        longitude: 150.899,
      },
      {
        name: "Connor Penrith",
        address: "Shop 230, 585 High Street",
        suburb: "Penrith",
        state: "NSW",
        postcode: "2750",
        latitude: -33.751,
        longitude: 150.694,
      },
      {
        name: "Connor Blacktown",
        address: "Shop 2050 WestPoint Shopping Centre, 17 Patrick Street",
        suburb: "Blacktown",
        state: "NSW",
        postcode: "2148",
        latitude: -33.771,
        longitude: 150.906,
      },
      {
        name: "Connor Warwick Farm DFO",
        address: "Shop 48 Fashion Spree, 5 Viscount Place",
        suburb: "Warwick Farm",
        state: "NSW",
        postcode: "2170",
        latitude: -33.912,
        longitude: 150.937,
      },
      {
        name: "Connor Liverpool",
        address: "Shop 242/43 Westfield Liverpool, Macquarie Street",
        suburb: "Liverpool",
        state: "NSW",
        postcode: "2170",
        latitude: -33.919,
        longitude: 150.925,
      },
      {
        name: "Connor Merrylands",
        address: "Shop 2041 Stocklands Merryland, 199-201 Pitt Street",
        suburb: "Merrylands",
        state: "NSW",
        postcode: "2160",
        latitude: -33.836,
        longitude: 150.989,
      },
      {
        name: "Connor Narellan",
        address: "Shop 160, Narellan Town Centre, 326 Camden Valley Way",
        suburb: "Narellan",
        state: "NSW",
        postcode: "2567",
        latitude: -34.043,
        longitude: 150.737,
      },
      {
        name: "Connor Parramatta",
        address: "Shop 2124 Westfield Parramatta, 159-175 Church Street",
        suburb: "Parramatta",
        state: "NSW",
        postcode: "2150",
        latitude: -33.817,
        longitude: 151.003,
      },
      {
        name: "Connor Rouse Hill",
        address: "Shop D-GR 158 Rouse Hill Town Centre, 10-14 Market Lane",
        suburb: "Rouse Hill",
        state: "NSW",
        postcode: "2155",
        latitude: -33.69,
        longitude: 150.926,
      },
    ],
  },
  {
    parentName: "yd. Australia Business Attire",
    url: "https://www.yd.com.au/au",
    websiteUrl: "https://www.yd.com.au/au",
    catalogs: ["https://www.yd.com.au/au/sale", "https://www.yd.com.au/au/offers", "https://www.yd.com.au/au/clothing/suits"],
    branches: [
      {
        name: "yd. Mt Druitt",
        address: "Shop 58, Westfield Mt Druitt, Cnr Carlisle Ave & Luxford Rd",
        suburb: "Mt Druitt",
        state: "NSW",
        postcode: "2770",
        latitude: -33.768,
        longitude: 150.819,
      },
      {
        name: "yd. Eastern Creek",
        address: "Shop 3205 Eastern Creek Quarter, 159 Rooty Hill Rd",
        suburb: "Eastern Creek",
        state: "NSW",
        postcode: "2766",
        latitude: -33.798,
        longitude: 150.849,
      },
      {
        name: "yd. Wetherill Park",
        address: "Shop 89, Stockland Wetherill Park, 561-583 Polding Street",
        suburb: "Wetherill Park",
        state: "NSW",
        postcode: "2164",
        latitude: -33.858,
        longitude: 150.899,
      },
      {
        name: "yd. Myer Penrith",
        address: "585 High St",
        suburb: "Penrith",
        state: "NSW",
        postcode: "2750",
        latitude: -33.751,
        longitude: 150.694,
      },
      {
        name: "yd. Penrith",
        address: "Shop 319 Westfield Penrith, 585 High St",
        suburb: "Penrith",
        state: "NSW",
        postcode: "2750",
        latitude: -33.751,
        longitude: 150.694,
      },
      {
        name: "yd. Blacktown",
        address: "Shop 3052/53, Westpoint Shopping Centre, Patrick Street",
        suburb: "Blacktown",
        state: "NSW",
        postcode: "2148",
        latitude: -33.771,
        longitude: 150.906,
      },
      {
        name: "yd. Warwick Farm Outlet",
        address: "Shop 24, Fashion Spree Outlet, 2-20 Orange Grove Rd",
        suburb: "Liverpool",
        state: "NSW",
        postcode: "2170",
        latitude: -33.912,
        longitude: 150.937,
      },
      {
        name: "yd. Liverpool",
        address: "Level 2, Shop 2008, Westfield Liverpool, Macquarie Street",
        suburb: "Liverpool",
        state: "NSW",
        postcode: "2170",
        latitude: -33.919,
        longitude: 150.925,
      },
      {
        name: "yd. Myer Liverpool",
        address: "Westfield Liverpool Myer, Macquarie St",
        suburb: "Liverpool",
        state: "NSW",
        postcode: "2170",
        latitude: -33.919,
        longitude: 150.925,
      },
      {
        name: "yd. Merrylands",
        address: "Shop 2009, Stockland Merrylands, Mcfarlane Street",
        suburb: "Merrylands",
        state: "NSW",
        postcode: "2160",
        latitude: -33.836,
        longitude: 150.989,
      },
      {
        name: "yd. Parramatta",
        address: "Shop 3060, Westfield Parramatta, 159-175 Church Street",
        suburb: "Parramatta",
        state: "NSW",
        postcode: "2150",
        latitude: -33.817,
        longitude: 151.003,
      },
      {
        name: "yd. Myer Parramatta",
        address: "Westfield Parramatta Myer, 159-175 Church Street",
        suburb: "Parramatta",
        state: "NSW",
        postcode: "2124",
        latitude: -33.817,
        longitude: 151.003,
      },
      {
        name: "yd. Rouse Hill",
        address: "Shop D-Gr 156, Rouse Hill Town Centre, 10-14 Market Lane",
        suburb: "Rouse Hill",
        state: "NSW",
        postcode: "2155",
        latitude: -33.69,
        longitude: 150.926,
      },
      {
        name: "yd. Macarthur Square",
        address: "Shop L03 U102 Macarthur Square, Gilchrist Drive",
        suburb: "Macarthur Square",
        state: "NSW",
        postcode: "2560",
        latitude: -34.073,
        longitude: 150.798,
      },
      {
        name: "yd. Castle Hill",
        address: "Shop 319, Castle Towers, Castle Street",
        suburb: "Castle Hill",
        state: "NSW",
        postcode: "2154",
        latitude: -33.731,
        longitude: 151.006,
      },
      {
        name: "yd. Bankstown",
        address: "Shop 200, Centro Bankstown, North Terrace",
        suburb: "Bankstown",
        state: "NSW",
        postcode: "2200",
        latitude: -33.918,
        longitude: 151.035,
      },
      {
        name: "yd. Homebush DFO",
        address: "Shop 23, Homebush DFO, 3-5 Underwood Road",
        suburb: "Homebush",
        state: "NSW",
        postcode: "2140",
        latitude: -33.856,
        longitude: 151.077,
      },
      {
        name: "yd. Roselands",
        address: "Shop G028, Centro Roselands, Roselands Drive",
        suburb: "Roselands",
        state: "NSW",
        postcode: "2196",
        latitude: -33.933,
        longitude: 151.074,
      },
      {
        name: "yd. Burwood",
        address: "Shop 117, Westfield Burwood, 100 Burwood",
        suburb: "Burwood",
        state: "NSW",
        postcode: "2134",
        latitude: -33.877,
        longitude: 151.103,
      },
      {
        name: "yd. Top Ryde",
        address: "Shop LG1 2010, Top Ryde City, Cnr Blaxland and Devlin Streets",
        suburb: "Ryde",
        state: "NSW",
        postcode: "2112",
        latitude: -33.812,
        longitude: 151.106,
      },
      {
        name: "yd. Hurstville",
        address: "Shop 458, Westfield Hurstville, Cnr Cross Street and Park Road",
        suburb: "Hurstville",
        state: "NSW",
        postcode: "2220",
        latitude: -33.967,
        longitude: 151.102,
      },
      {
        name: "yd. Birkenhead Point",
        address: "Shop 67/68 Birkenhead Point Outlet Centre, 19 Roseby Street",
        suburb: "Drummoyne",
        state: "NSW",
        postcode: "2047",
        latitude: -33.856,
        longitude: 151.162,
      },
      {
        name: "yd. Miranda",
        address: "Shop 3096/7, Westfield Miranda, 600 The Kingsway",
        suburb: "Miranda",
        state: "NSW",
        postcode: "2228",
        latitude: -34.035,
        longitude: 151.101,
      },
      {
        name: "yd. Broadway",
        address: "Shop 111, Broadway Shopping Centre, 1 Bay Street",
        suburb: "Broadway",
        state: "NSW",
        postcode: "2007",
        latitude: -33.884,
        longitude: 151.194,
      },
      {
        name: "yd. Market City DFO",
        address: "Shop R2.08, Market City, 9-13 Hay Street",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        latitude: -33.879,
        longitude: 151.203,
      },
      {
        name: "yd. Myer Sydney CBD",
        address: "436 George St",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        latitude: -33.87,
        longitude: 151.208,
      },
      {
        name: "yd. Hobart Tasmania",
        address: "Shop 37/39, Cat & Fiddle Shopping Centre, 101 Collins Street",
        suburb: "Hobart",
        state: "TAS",
        postcode: "7000",
        latitude: -42.883,
        longitude: 147.327,
      },
    ],
  },
];

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function main() {
  const category = await prisma.category.findUnique({ where: { name: "Clothing & Fashions" } });

  if (!category) {
    throw new Error("Clothing & Fashions category not found");
  }

  let created = 0;
  let updated = 0;

  for (const brand of brands) {
    const parent = await prisma.store.findFirst({
      where: {
        categoryId: category.id,
        OR: [
          { name: { equals: brand.parentName, mode: "insensitive" } },
          { url: { contains: new URL(brand.websiteUrl).hostname.replace(/^www\./, ""), mode: "insensitive" } },
          { websiteUrl: { contains: new URL(brand.websiteUrl).hostname.replace(/^www\./, ""), mode: "insensitive" } },
        ],
      },
      orderBy: { id: "asc" },
    });

    if (!parent) {
      console.warn(`Skipping ${brand.parentName}: parent store not found`);
      continue;
    }

    await prisma.store.update({
      where: { id: parent.id },
      data: {
        url: brand.url,
        websiteUrl: brand.websiteUrl,
        catalogs: Array.from(new Set([...(parent.catalogs || []), ...brand.catalogs])),
        locationSource: parent.locationSource || "online",
      },
    });

    for (const branch of brand.branches) {
      const url = `${brand.websiteUrl}#${slug(`${branch.name} ${branch.address} ${branch.suburb} ${branch.state} ${branch.postcode}`)}`;
      const existing = await prisma.store.findFirst({
        where: {
          categoryId: category.id,
          OR: [{ url }, { name: branch.name, address: branch.address }],
        },
      });
      const data = {
        name: branch.name,
        url,
        suburb: branch.suburb,
        city: branch.suburb,
        state: branch.state,
        country: "Australia",
        address: `${branch.address}, ${branch.suburb} ${branch.state} ${branch.postcode}`,
        catalogs: brand.catalogs,
        sourceType: "website",
        websiteUrl: brand.websiteUrl,
        latitude: branch.latitude,
        longitude: branch.longitude,
        locationSource: "suburb",
        categoryId: category.id,
        ownerId: parent.ownerId,
        contact: parent.contact,
        background: parent.background,
        description: `Branch location discovered from ${brand.parentName} store locator.`,
      };

      if (existing) {
        await prisma.store.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.store.create({ data });
        created += 1;
      }
    }
  }

  console.log(JSON.stringify({ created, updated }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
