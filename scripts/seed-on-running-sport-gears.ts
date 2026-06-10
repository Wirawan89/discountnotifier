import { RegionalStoreSeed, seedRegionalStores } from "./lib/seed-regional-stores";

const onUrl = "https://www.on.com/en-au/";
const onLastSeasonUrl = "https://www.on.com/en-au/shop/shoes/last-season";
const onCatalogs = [
  onLastSeasonUrl,
  "https://www.on.com/en-au/shop/apparel/last-season",
];

const davidJonesOnUrl = "https://www.davidjones.com/brand/on-running";
const jdOnUrl = "https://www.jd-sports.com.au/brand/on-running/sport/running/";
const athletesFootOnUrl = "https://www.theathletesfoot.com.au/brands/on-running.html";

const stores: RegionalStoreSeed[] = [
  {
    name: "On Running Australia",
    url: onUrl,
    websiteUrl: onUrl,
    verificationUrl: onLastSeasonUrl,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "On Running Australia online store",
    catalogs: onCatalogs,
    description: "Official On Running Australia online store for performance running shoes, apparel and accessories.",
    locationSource: "online",
  },
  {
    name: "On Store Melbourne Emporium",
    url: `${onUrl}#melbourne-emporium-vic`,
    websiteUrl: onUrl,
    verificationUrl: onLastSeasonUrl,
    suburb: "Melbourne CBD",
    city: "Melbourne",
    state: "VIC",
    address: "Shop G011, 287 Lonsdale Street, Melbourne VIC 3000",
    catalogs: onCatalogs,
    description: "Official On Running Melbourne store for performance running shoes, apparel and accessories.",
    latitude: -37.8126,
    longitude: 144.9631,
  },
  {
    name: "On Running at David Jones Online",
    url: davidJonesOnUrl,
    websiteUrl: davidJonesOnUrl,
    verificationUrl: davidJonesOnUrl,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "David Jones online On Running brand page",
    catalogs: [davidJonesOnUrl],
    description: "On Running products stocked through David Jones Australia online.",
    locationSource: "online",
  },
  {
    name: "On Running at JD Sports Online",
    url: jdOnUrl,
    websiteUrl: jdOnUrl,
    verificationUrl: jdOnUrl,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "JD Sports Australia online On Running brand page",
    catalogs: [jdOnUrl],
    description: "On Running products stocked through JD Sports Australia online.",
    locationSource: "online",
  },
  {
    name: "On Running at The Athlete's Foot Online",
    url: athletesFootOnUrl,
    websiteUrl: athletesFootOnUrl,
    verificationUrl: athletesFootOnUrl,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "The Athlete's Foot Australia online On Running brand page",
    catalogs: [athletesFootOnUrl],
    description: "On Running products stocked through The Athlete's Foot Australia online.",
    locationSource: "online",
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
