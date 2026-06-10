import { RegionalStoreSeed, seedRegionalStores } from "./lib/seed-regional-stores";

const hokaUrl = "https://au.hoka.com/";
const hokaSaleCatalogs = [
  "https://au.hoka.com/categories/sale",
  "https://au.hoka.com/categories/sale/mens-sale",
  "https://au.hoka.com/categories/sale/womens-sale",
  "https://au.hoka.com/categories/sale/sale-activity",
];

const onitsukaUrl = "https://www.onitsukatiger.com/au/en-au/";
const onitsukaSaleUrl = "https://www.onitsukatiger.com/au/en-au/sale";
const onitsukaSaleCatalogs = [onitsukaSaleUrl];

const stores: RegionalStoreSeed[] = [
  {
    name: "HOKA Australia",
    url: hokaUrl,
    websiteUrl: hokaUrl,
    verificationUrl: "https://au.hoka.com/categories/sale",
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "HOKA Australia online store",
    catalogs: hokaSaleCatalogs,
    description: "Official HOKA Australia online store for running, walking and performance footwear.",
    locationSource: "online",
  },
  {
    name: "HOKA Pacific Fair",
    url: `${hokaUrl}#pacific-fair-qld`,
    websiteUrl: hokaUrl,
    verificationUrl: "https://au.hoka.com/categories/sale",
    suburb: "Broadbeach",
    city: "Gold Coast",
    state: "QLD",
    address: "Pacific Fair Shopping Centre, Hooker Boulevard, Broadbeach QLD 4218",
    catalogs: hokaSaleCatalogs,
    description: "Official HOKA Australia store listing for running, walking and performance footwear.",
  },
  {
    name: "HOKA Chermside",
    url: `${hokaUrl}#chermside-qld`,
    websiteUrl: hokaUrl,
    verificationUrl: "https://au.hoka.com/categories/sale",
    suburb: "Chermside",
    city: "Brisbane",
    state: "QLD",
    address: "Westfield Chermside, Gympie Road, Chermside QLD 4032",
    catalogs: hokaSaleCatalogs,
    description: "Official HOKA Australia store listing for running, walking and performance footwear.",
  },
  {
    name: "Onitsuka Tiger Australia",
    url: onitsukaUrl,
    websiteUrl: onitsukaUrl,
    verificationUrl: onitsukaSaleUrl,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "Onitsuka Tiger Australia online store",
    catalogs: onitsukaSaleCatalogs,
    description: "Official Onitsuka Tiger Australia online store for sports-inspired footwear and apparel.",
    locationSource: "online",
  },
  {
    name: "Onitsuka Tiger Sydney QVB",
    url: "https://www.onitsukatiger.com/au/en-au/onitsuka-tiger-sydney",
    websiteUrl: onitsukaUrl,
    verificationUrl: onitsukaSaleUrl,
    suburb: "Sydney CBD",
    city: "Sydney",
    state: "NSW",
    address: "Shop 59/61, QVB Walk, 455 George Street, Sydney NSW 2000",
    contact: "02 9261 5505",
    catalogs: onitsukaSaleCatalogs,
    description: "Official Onitsuka Tiger Sydney QVB store for sports-inspired footwear and apparel.",
  },
  {
    name: "Onitsuka Tiger Melbourne Emporium",
    url: "https://www.onitsukatiger.com/au/en-au/onitsuka-tiger-melbourne-emporium",
    websiteUrl: onitsukaUrl,
    verificationUrl: onitsukaSaleUrl,
    suburb: "Melbourne CBD",
    city: "Melbourne",
    state: "VIC",
    address: "Shop G-038, Emporium Melbourne, 287 Lonsdale Street, Melbourne VIC 3000",
    contact: "03 9639 7800",
    catalogs: onitsukaSaleCatalogs,
    description: "Official Onitsuka Tiger Melbourne Emporium store for sports-inspired footwear and apparel.",
  },
];

seedRegionalStores({
  regionName: "Australia",
  categoryName: "Sport Gears",
  verifierProfile: "retailShop",
  stores,
  maxPages: 5,
  requestTimeoutMs: 15000,
  concurrency: 2,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
