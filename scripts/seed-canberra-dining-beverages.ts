import { DiningBeverageVenue, seedDiningBeverageRegion } from "./lib/seed-dining-beverages-region";

const venues: DiningBeverageVenue[] = [
  {
    name: "Pilot Ainslie",
    url: "https://pilotrestaurant.com/",
    suburb: "Ainslie",
    city: "Canberra",
    state: "ACT",
    address: "1 Wakefield Gardens, Ainslie ACT 2602",
    catalogs: ["https://pilotrestaurant.com/"],
    description: "Canberra fine dining restaurant serving dinner, degustation and wine-led experiences.",
  },
  {
    name: "Bar Rochford Canberra",
    url: "https://barrochford.com/",
    suburb: "Canberra",
    city: "Canberra",
    state: "ACT",
    address: "First Floor, 65 London Circuit, Canberra ACT 2601",
    catalogs: ["https://barrochford.com/"],
    description: "Canberra wine and cocktail bar serving dinner, drinks and late-night music-friendly hospitality.",
  },
  {
    name: "Akiba Canberra",
    url: "https://akiba.com.au/",
    suburb: "Canberra",
    city: "Canberra",
    state: "ACT",
    address: "40 Bunda Street, Canberra ACT 2601",
    catalogs: ["https://akiba.com.au/", "https://akiba.com.au/whats-on/"],
    description: "Canberra Asian restaurant and bar serving lunch, dinner, cocktails and lively events.",
  },
  {
    name: "Monster Kitchen and Bar Canberra",
    url: "https://monsterkitchen.com.au/",
    suburb: "Canberra",
    city: "Canberra",
    state: "ACT",
    address: "25 Edinburgh Avenue, Canberra ACT 2601",
    catalogs: ["https://monsterkitchen.com.au/"],
    description: "Canberra restaurant and bar serving lunch, dinner, cocktails and hotel dining.",
  },
  {
    name: "Molly Canberra",
    url: "https://molly.bar/",
    suburb: "Canberra",
    city: "Canberra",
    state: "ACT",
    address: "Odgers Lane, Canberra ACT 2601",
    catalogs: ["https://molly.bar/"],
    description: "Hidden Canberra cocktail and whisky bar serving drinks and live jazz-style hospitality.",
  },
  {
    name: "Corella Braddon",
    url: "https://www.corellabar.com.au/",
    suburb: "Braddon",
    city: "Canberra",
    state: "ACT",
    address: "14 Lonsdale Street, Braddon ACT 2612",
    catalogs: ["https://www.corellabar.com.au/"],
    description: "Braddon restaurant and bar serving modern Australian dinner, wine and cocktails.",
  },
  {
    name: "Paranormal Wines Campbell",
    url: "https://www.paranormalwines.com.au/",
    suburb: "Campbell",
    city: "Canberra",
    state: "ACT",
    address: "27 Lonsdale Street, Braddon ACT 2612",
    catalogs: ["https://www.paranormalwines.com.au/"],
    description: "Canberra wine bar and kitchen serving dinner, drinks and bottle-shop hospitality.",
  },
  {
    name: "Highball Canberra",
    url: "https://highball.com.au/",
    suburb: "Canberra",
    city: "Canberra",
    state: "ACT",
    address: "82 Alinga Street, Canberra ACT 2601",
    catalogs: ["https://highball.com.au/"],
    description: "Canberra cocktail bar serving rum, drinks, events and late-night bar food.",
  },
];

seedDiningBeverageRegion("Canberra ACT", venues).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
