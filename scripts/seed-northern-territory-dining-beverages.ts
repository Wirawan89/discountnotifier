import { DiningBeverageVenue, seedDiningBeverageRegion } from "./lib/seed-dining-beverages-region";

const venues: DiningBeverageVenue[] = [
  {
    name: "Wharf One Darwin",
    url: "https://wharfone.com.au/",
    suburb: "Darwin City",
    city: "Darwin",
    state: "NT",
    address: "19 Kitchener Drive, Darwin City NT 0800",
    catalogs: ["https://wharfone.com.au/"],
    description: "Darwin waterfront restaurant and bar serving lunch, dinner, drinks and harbour dining.",
  },
  {
    name: "Hot Tamale Darwin",
    url: "https://hottamale.net.au/",
    suburb: "Darwin City",
    city: "Darwin",
    state: "NT",
    address: "F2, 19 Kitchener Drive, Darwin City NT 0800",
    catalogs: ["https://hottamale.net.au/", "https://hottamale.net.au/whats-on/"],
    description: "Darwin Mexican restaurant and tequila bar serving lunch, dinner, cocktails and waterfront drinks.",
  },
  {
    name: "Charlie's of Darwin",
    url: "https://charliesofdarwin.com.au/",
    suburb: "Darwin City",
    city: "Darwin",
    state: "NT",
    address: "56 Smith Street, Darwin City NT 0800",
    catalogs: ["https://charliesofdarwin.com.au/"],
    description: "Darwin restaurant, gin bar and distillery serving dinner, cocktails and tropical city hospitality.",
  },
  {
    name: "Stone House Wine Bar Darwin",
    url: "https://stonehousewinebar.com.au/",
    suburb: "Darwin City",
    city: "Darwin",
    state: "NT",
    address: "33 Cavenagh Street, Darwin City NT 0800",
    catalogs: ["https://stonehousewinebar.com.au/"],
    description: "Darwin wine bar serving drinks, dinner plates and intimate late-night hospitality.",
  },
  {
    name: "Ella by Minoli Darwin",
    url: "https://ellabyminoli.com.au/",
    suburb: "Darwin City",
    city: "Darwin",
    state: "NT",
    address: "20 West Lane, Darwin City NT 0800",
    catalogs: ["https://ellabyminoli.com.au/"],
    description: "Darwin Sri Lankan restaurant and bar serving dinner, cocktails and chef-led dining.",
  },
  {
    name: "Pee Wee's at the Point Darwin",
    url: "https://peewees.com.au/",
    suburb: "East Point",
    city: "Darwin",
    state: "NT",
    address: "Alec Fong Lim Drive, East Point NT 0820",
    catalogs: ["https://peewees.com.au/"],
    description: "Darwin waterfront restaurant serving lunch, dinner, drinks and tropical fine dining.",
  },
  {
    name: "Epilogue Lounge Alice Springs",
    url: "https://www.epiloguelounge.com.au/",
    suburb: "Alice Springs",
    city: "Alice Springs",
    state: "NT",
    address: "1/58 Todd Mall, Alice Springs NT 0870",
    catalogs: ["https://www.epiloguelounge.com.au/"],
    description: "Alice Springs lounge, restaurant and bar serving dinner, cocktails and live local hospitality.",
  },
  {
    name: "Page 27 Cafe Alice Springs",
    url: "https://page27.com.au/",
    suburb: "Alice Springs",
    city: "Alice Springs",
    state: "NT",
    address: "3 Fan Arcade, Alice Springs NT 0870",
    catalogs: ["https://page27.com.au/"],
    description: "Alice Springs laneway venue serving food, drinks and evening-friendly local dining.",
  },
];

seedDiningBeverageRegion("Northern Territory", venues).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
