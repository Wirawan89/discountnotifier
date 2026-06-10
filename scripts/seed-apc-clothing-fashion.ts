import { RegionalStoreSeed, seedRegionalStores } from "./lib/seed-regional-stores";

const officialUrl = "https://www.apcstore.com/";
const officialSaleUrl = "https://www.apcstore.com/pages/sale";
const officialSaleCatalogs = [
  officialSaleUrl,
  "https://www.apcstore.com/collections/sale",
  "https://www.apcstore.com/surplu-s.html",
];

const incuApcUrl = "https://www.incu.com/pages/a-p-c-x-incu";
const incuApcCatalogs = [
  incuApcUrl,
  "https://www.incu.com/collections/a-p-c",
  "https://www.incu.com/collections/sale",
  "https://www.incu.com/collections/womens-sale",
  "https://www.incu.com/collections/mens-sale",
];

const davidJonesApcUrl = "https://www.davidjones.com/brand/apc?src=fh";

const stores: RegionalStoreSeed[] = [
  {
    name: "A.P.C Official Online",
    url: officialUrl,
    websiteUrl: officialUrl,
    verificationUrl: officialSaleUrl,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "A.P.C official online store shipping to Australia",
    catalogs: officialSaleCatalogs,
    description: "Official A.P.C online store for French ready-to-wear, denim, footwear, bags and accessories.",
    locationSource: "online",
  },
  {
    name: "A.P.C Sydney",
    url: `${incuApcUrl}#sydney-surry-hills-nsw`,
    websiteUrl: incuApcUrl,
    verificationUrl: incuApcUrl,
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "2/410 Crown Street, Surry Hills NSW 2010",
    contact: "02 9380 2010",
    latitude: -33.8874,
    longitude: 151.2135,
    catalogs: incuApcCatalogs,
    description: "A.P.C Sydney boutique operated by Incu, stocking A.P.C clothing, denim, footwear and accessories.",
  },
  {
    name: "A.P.C Melbourne QV",
    url: `${incuApcUrl}#melbourne-qv-vic`,
    websiteUrl: incuApcUrl,
    verificationUrl: incuApcUrl,
    suburb: "Melbourne CBD",
    city: "Melbourne",
    state: "VIC",
    address: "Albert Coates Lane, QV Melbourne, Melbourne VIC 3000",
    contact: "03 9639 1877",
    latitude: -37.8109,
    longitude: 144.9654,
    catalogs: incuApcCatalogs,
    description: "A.P.C Melbourne QV boutique operated by Incu, stocking A.P.C clothing, denim, footwear and accessories.",
  },
  {
    name: "A.P.C at Incu Online",
    url: incuApcUrl,
    websiteUrl: incuApcUrl,
    verificationUrl: incuApcUrl,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "Incu online A.P.C brand page",
    catalogs: incuApcCatalogs,
    description: "A.P.C stocked through Incu Australia online and selected Incu boutiques.",
    locationSource: "online",
  },
  {
    name: "A.P.C at David Jones Online",
    url: davidJonesApcUrl,
    websiteUrl: davidJonesApcUrl,
    verificationUrl: davidJonesApcUrl,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "David Jones online A.P.C brand page",
    catalogs: [
      davidJonesApcUrl,
      "https://www.davidjones.com/search?text=A.P.C",
      "https://www.davidjones.com/sale",
    ],
    description: "A.P.C stocked through David Jones Australia online.",
    locationSource: "online",
    ignoredOfferUrlPatterns: [/\/sale(?:[/?#]|$)/i],
  },
];

seedRegionalStores({
  regionName: "Australia-wide",
  categoryName: "Clothing & Fashions",
  verifierProfile: "retailShop",
  stores,
  maxPages: 5,
  requestTimeoutMs: 15000,
  concurrency: 2,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
