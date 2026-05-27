import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test user with hashed password
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      password: hashedPassword,
      name: 'Test User',
      suburb: 'Sydney'
    },
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      suburb: 'Sydney'
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Business Attire' },
      update: {},
      create: { name: 'Business Attire' },
    }),
    prisma.category.upsert({
      where: { name: 'Clothing & Fashions' },
      update: {},
      create: { name: 'Clothing & Fashions' },
    }),
    prisma.category.upsert({
      where: { name: 'Cosmetic & Perfumes' },
      update: {},
      create: { name: 'Cosmetic & Perfumes' },
    }),
    prisma.category.upsert({
      where: { name: 'Dining & Beverages' },
      update: {},
      create: { name: 'Dining & Beverages' },
    }),
    prisma.category.upsert({
        where: { name: 'HIFI Audio & Speakers' },
        update: {},
        create: { name: 'HIFI Audio & Speakers' },
      }),
      prisma.category.upsert({
        where: { name: 'Leather Jackets & Bags' },
        update: {},
        create: { name: 'Leather Jackets & Bags' },
      }),
      prisma.category.upsert({
        where: { name: 'Music Gears' },
        update: {},
        create: { name: 'Music Gears' },
      }),
      prisma.category.upsert({
        where: { name: 'Sport Gears' },
        update: {},
        create: { name: 'Sport Gears' },
      }),
      prisma.category.upsert({
        where: { name: 'Food & Groceries' },
        update: {},
        create: { name: 'Food & Groceries' },
      }),
      prisma.category.upsert({
        where: { name: 'Entertainment & Events' },
        update: {},
        create: { name: 'Entertainment & Events' },
      }),
      prisma.category.upsert({
        where: { name: 'Electronic & Gadgets' },
        update: {},
        create: { name: 'Electronic & Gadgets' },
      }),
      prisma.category.upsert({
        where: { name: 'Vitamins & Supplements' },
        update: {},
        create: { name: 'Vitamins & Supplements' },
      }),
      prisma.category.upsert({
        where: { name: 'Luxury & Designer' },
        update: {},
        create: { name: 'Luxury & Designer' },
      }),
      prisma.category.upsert({
        where: { name: 'Baby & Kids' },
        update: {},
        create: { name: 'Baby & Kids' },
      }),
      prisma.category.upsert({
        where: { name: 'Trending Toys' },
        update: {},
        create: { name: 'Trending Toys' },
      }),
      prisma.category.upsert({
        where: { name: 'Travel & Accommodation' },
        update: {},
        create: { name: 'Travel & Accommodation' },
      }),
      prisma.category.upsert({
        where: { name: 'Traveling Accessories' },
        update: {},
        create: { name: 'Traveling Accessories' },
      }),
      prisma.category.upsert({
        where: { name: 'Home & Garden' },
        update: {},
        create: { name: 'Home & Garden' },
      }),
      prisma.category.upsert({
        where: { name: 'Books & Magazines' },
        update: {},
        create: { name: 'Books & Magazines' },
      }),
      prisma.category.upsert({
        where: { name: 'Office & Stationery' },
        update: {},
        create: { name: 'Office & Stationery' },
      }),
      prisma.category.upsert({
        where: { name: 'Financial & Services' },
        update: {},
        create: { name: 'Financial & Services' },
      }),
      prisma.category.upsert({
        where: { name: 'Pets Supplies' },
        update: {},
        create: { name: 'Pets Supplies' },
      }),
      prisma.category.upsert({
        where: { name: 'Tools & DIY' },
        update: {},
        create: { name: 'Tools & DIY' },
      }),
      prisma.category.upsert({
        where: { name: 'Games' },
        update: {},
        create: { name: 'Games' },
      }),
      prisma.category.upsert({
        where: { name: 'Gifts & Flowers' },
        update: {},
        create: { name: 'Gifts & Flowers' },
      }),
      prisma.category.upsert({
        where: { name: 'Caffe & Brunch' },
        update: {},
        create: { name: 'Caffe & Brunch' },
      }),
      prisma.category.upsert({
        where: { name: 'Cars Accessories' },
        update: {},
        create: { name: 'Cars Accessories' },
      }),
    
  ]);

  // Create some test stores
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { url: 'https://marketpal.ai' },
      update: {
        name: 'Marketpal.ai',
        suburb: 'Sydney',
        categoryId: categories[20].id,
        ownerId: user.id,
      },
      create: {
        name: 'Marketpal.ai',
        suburb: 'Sydney',
        categoryId: categories[20].id,
        url: 'https://marketpal.ai',
        ownerId: user.id,
      },
    }),
    prisma.store.upsert({
      where: { url: 'https://wirawanbakery.com' },
      update: {
        name: 'Wirawan Bakery-Testing',
        suburb: 'Melbourne',
        categoryId: categories[25].id,
        ownerId: user.id,
      },
      create: {
        name: 'Wirawan Bakery-Testing',
        suburb: 'Melbourne',
        categoryId: categories[25].id,
        url: 'https://wirawanbakery.com',
        ownerId: user.id,
      },
    }),
    prisma.store.upsert({
        where: { url: 'https://wirawanbars.com' },
        update: {
          name: 'Wirawan Bars-Testing',
          suburb: 'Sydney',
          categoryId: categories[3].id,
          ownerId: user.id,
        },
        create: {
          name: 'Wirawan Bars-Testing',
          suburb: 'Sydney',
          categoryId: categories[3].id,
          url: 'https://wirawanbars.com',
          ownerId: user.id,
        },
      }),
      prisma.store.upsert({
        where: { url: 'https://wbdepartementstore.com' },
        update: {
          name: 'WB Departement Store-Testing',
          suburb: 'Sydney',
          categoryId: categories[10].id,
          ownerId: user.id,
        },
        create: {
          name: 'WB Departement Store-Testing',
          suburb: 'Sydney',
          categoryId: categories[10].id,
          url: 'https://wbdepartementstore.com',
          ownerId: user.id,
        },
      }),
  ]);

  const sportGearsCategory = categories.find((category) => category.name === 'Sport Gears');

  if (!sportGearsCategory) {
    throw new Error('Sport Gears category was not created');
  }

  const sportGearStores = [
    {
      name: 'Nike Australia',
      url: 'https://www.nike.com/au/',
      catalogs: [
        'https://www.nike.com/au/w/sale-3yaepzb2tbxzq3un',
        'https://www.nike.com/au/promo-code',
      ],
    },
    {
      name: 'lululemon Australia',
      url: 'https://www.lululemon.com.au/en-au/home',
      catalogs: ['https://www.lululemon.com.au/en-au/c/sale/luon?pmid=markdownPromotion'],
    },
    {
      name: 'adidas Australia',
      url: 'https://www.adidas.com.au/',
      catalogs: ['https://www.adidas.com.au/sale'],
    },
    {
      name: 'JD Sports Australia',
      url: 'https://www.jd-sports.com.au/',
      catalogs: [
        'https://www.jd-sports.com.au/campaign/jd%2Bexclusive/sale/',
        'https://www.jd-sports.com.au/page/sale/',
      ],
    },
    {
      name: 'Alo Yoga Australia',
      url: 'https://www.aloyoga.com/en-au',
      catalogs: ['https://www.aloyoga.com/en-au/pages/sale?limit=all'],
    },
    {
      name: "Arc'teryx Australia",
      url: 'https://arcteryx.com.au/',
      catalogs: ['https://arcteryx.com.au/collections/outlet'],
    },
    {
      name: 'Under Armour Australia',
      url: 'https://www.underarmour.com.au/',
      catalogs: [
        'https://www.underarmour.com.au/en-au/c/outlet/',
        'https://www.underarmour.com.au/en-au/c/sale/',
      ],
    },
    {
      name: 'Lorna Jane Australia',
      url: 'https://www.lornajane.com.au/',
      catalogs: ['https://www.lornajane.com.au/product-index/sale-shop-all'],
    },
    {
      name: 'STAX Australia',
      url: 'https://stax.com.au/',
      catalogs: [
        'https://stax.com.au/collections/50-off-flash-sale',
        'https://stax.com.au/collections/30-off',
        'https://stax.com.au/collections/40-off',
      ],
    },
    {
      name: 'Canada Goose Australia',
      url: 'https://www.canadagoose.com/au/en/',
      catalogs: [
        'https://www.canadagoose.com/au/en/sale',
        'https://www.canadagoose.com/au/en/outlet',
      ],
    },
    {
      name: 'Salomon Australia',
      url: 'https://salomon.com.au/',
      catalogs: ['https://salomon.com.au/collections/outlet'],
    },
    {
      name: 'Rebel Sport Australia',
      url: 'https://www.rebelsport.com.au/',
      catalogs: ['https://www.rebelsport.com.au/sale?search_term=sale'],
    },
    {
      name: "The Athlete's Foot Australia",
      url: 'https://www.theathletesfoot.com.au/',
      catalogs: ['https://www.theathletesfoot.com.au/shop/sale/womens/outdoor'],
    },
    {
      name: 'Foot Locker Australia',
      url: 'https://www.footlocker.com.au/en/',
      catalogs: ['https://www.footlocker.com.au/en/category/sale.html'],
    },
    {
      name: 'PUMA Australia',
      url: 'https://au.puma.com/au/en',
      catalogs: ['https://au.puma.com/au/en/sale'],
    },
    {
      name: 'ASICS Australia',
      url: 'https://www.asics.com/au/en-au/',
      catalogs: ['https://www.asics.com/au/en-au/sale/c/au80105000/'],
    },
    {
      name: 'New Balance Australia',
      url: 'https://www.newbalance.com.au/',
      catalogs: ['https://www.newbalance.com.au/sale/'],
    },
    {
      name: 'Running Warehouse Australia',
      url: 'https://www.runningwarehouse.com.au/',
      catalogs: ['https://www.runningwarehouse.com.au/Running_Warehouse_Australia_Sale/catpage-SALERWPP.html'],
    },
    {
      name: 'INTERSPORT Australia',
      url: 'https://intersport.com.au/',
      catalogs: ['https://intersport.com.au/collections/sale'],
    },
    {
      name: 'SportsPower Australia',
      url: 'https://www.sportspower.com.au/',
      catalogs: ['https://www.sportspower.com.au/pages/gear-up-for-game-day'],
    },
    {
      name: 'Macpac Australia',
      url: 'https://www.macpac.com.au/',
      catalogs: ['https://www.macpac.com.au/sale'],
    },
    {
      name: 'Decathlon Australia',
      url: 'https://www.decathlon.com.au/',
      catalogs: ['https://www.decathlon.com.au/s/summer-sale'],
    },
  ];

  await Promise.all(
    sportGearStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: sportGearsCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: sportGearsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const foodGroceriesCategory = categories.find((category) => category.name === 'Food & Groceries');

  if (!foodGroceriesCategory) {
    throw new Error('Food & Groceries category was not created');
  }

  const groceryStores = [
    {
      name: 'Coles Australia',
      url: 'https://www.coles.com.au',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.coles.com.au/on-special',
        'https://www.coles.com.au/catalogues-and-specials',
      ],
    },
    {
      name: 'Woolworths Australia',
      url: 'https://www.woolworths.com.au',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.woolworths.com.au/shop/browse/specials',
        'https://catalogues.woolworths.com.au/',
      ],
    },
    {
      name: 'ALDI Australia',
      url: 'https://www.aldi.com.au',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.aldi.com.au/special-buys',
        'https://www.aldi.com.au/weekly-specials',
      ],
    },
    {
      name: 'IGA Australia',
      url: 'https://www.iga.com.au',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.iga.com.au/catalogue/',
        'https://www.iga.com.au/promotions/',
        'https://www.igashop.com.au/specials',
      ],
    },
    {
      name: 'Harris Farm Markets',
      url: 'https://www.harrisfarm.com.au',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.harrisfarm.com.au/pages/leichhardt',
        'https://www.harrisfarm.com.au/collections/specials',
      ],
    },
    {
      name: 'Thai Kee IGA',
      url: 'https://www.iga.com.au/stores/iga-local-grocer-thai-kee/',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [
        'https://www.iga.com.au/catalogue/',
        'https://www.iga.com.au/promotions/',
      ],
    },
    {
      name: 'Norton St Grocer',
      url: 'https://www.nortonstgrocer.com.au',
      suburb: 'Leichhardt',
      city: 'Sydney',
      catalogs: [
        'https://www.nortonstgrocer.com.au/collections/specials',
        'https://www.nortonstgrocer.com.au/collections/sale',
      ],
    },
    {
      name: 'Costco Australia',
      url: 'https://www.costco.com.au',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.costco.com.au/hot-buys',
        'https://www.costco.com.au/c/hot-buys',
        'https://www.costco.com.au/costco-deals',
      ],
    },
    {
      name: 'JJ Asian Supermarket',
      url: 'https://www.meriton.com.au/retail-precinct/meriton-retail-precinct-mascot-central/',
      suburb: 'Mascot',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Foodland Australia',
      url: 'https://www.foodlandsa.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [
        'https://www.foodlandsa.com.au/catalogue/',
        'https://www.foodlandsa.com.au/specials/',
      ],
    },
    {
      name: 'Drakes Supermarkets',
      url: 'https://drakes.com.au/',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: [
        'https://drakes.com.au/specials/',
        'https://drakes.com.au/catalogue/',
      ],
    },
    {
      name: 'Ritchies IGA',
      url: 'https://www.ritchies.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [
        'https://www.ritchies.com.au/catalogue',
        'https://www.ritchies.com.au/promotions',
      ],
    },
    {
      name: 'QE Foodstores',
      url: 'https://qefoodstores.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://qefoodstores.com.au/specials/'],
    },
    {
      name: 'The Fruitologist',
      url: 'https://www.thefruitologist.com.au/',
      suburb: 'Rozelle',
      city: 'Sydney',
      catalogs: ['https://www.thefruitologist.com.au/specials'],
    },
    {
      name: 'Panetta Mercato',
      url: 'https://panettamercato.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://panettamercato.com.au/specials/'],
    },
    {
      name: 'The Meat Emporium',
      url: 'https://www.meatemporium.com.au/',
      suburb: 'Alexandria',
      city: 'Sydney',
      catalogs: ['https://www.meatemporium.com.au/specials'],
    },
    {
      name: 'FruitEzy',
      url: 'https://fruitezy.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://fruitezy.com.au/collections/specials'],
    },
  ];

  await Promise.all(
    groceryStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: foodGroceriesCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: foodGroceriesCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const cosmeticPerfumesCategory = categories.find((category) => category.name === 'Cosmetic & Perfumes');

  if (!cosmeticPerfumesCategory) {
    throw new Error('Cosmetic & Perfumes category was not created');
  }

  const beautyStores = [
    {
      name: 'Lila Beauty Australia',
      url: 'https://lilabeauty.com.au',
      catalogs: [
        'https://lilabeauty.com.au/collections/sale',
        'https://lilabeauty.com.au/collections/flash-sale',
      ],
    },
    {
      name: 'Sephora Australia',
      url: 'https://www.sephora.com.au',
      catalogs: ['https://www.sephora.com.au/sale'],
    },
    {
      name: 'W Cosmetics Australia',
      url: 'https://wcosmetics.com.au',
      catalogs: [
        'https://wcosmetics.com.au/collections/sales-2026',
        'https://wcosmetics.com.au/collections/50-off-april-sale-1',
        'https://wcosmetics.com.au/collections/special-offer-may-sale',
      ],
    },
    {
      name: 'MECCA Australia',
      url: 'https://www.mecca.com/en-au/',
      catalogs: [],
    },
    {
      name: 'Adore Beauty Australia',
      url: 'https://www.adorebeauty.com.au',
      catalogs: [
        'https://www.adorebeauty.com.au/c/specials/sale/clearance.html',
        'https://www.adorebeauty.com.au/promotion.html',
        'https://www.adorebeauty.com.au/c/specials.html',
      ],
    },
    {
      name: 'Priceline Australia',
      url: 'https://www.priceline.com.au/',
      catalogs: ['https://www.priceline.com.au/c/sale/'],
    },
    {
      name: 'Chemist Warehouse Australia',
      url: 'https://www.chemistwarehouse.com.au/',
      catalogs: ['https://www.chemistwarehouse.com.au/catalogue'],
    },
    {
      name: 'Oz Hair & Beauty',
      url: 'https://www.ozhairandbeauty.com/',
      catalogs: [
        'https://www.ozhairandbeauty.com/sale',
        'https://www.ozhairandbeauty.com/promotions',
      ],
    },
    {
      name: 'RY Australia',
      url: 'https://ry.com.au/',
      catalogs: ['https://ry.com.au/collections/sale'],
    },
    {
      name: 'Lookfantastic Australia',
      url: 'https://lookfantastic.com.au/',
      catalogs: ['https://lookfantastic.com.au/collections/sale'],
    },
    {
      name: 'The Beauty Chef Australia',
      url: 'https://thebeautychef.com/',
      catalogs: ['https://thebeautychef.com/collections/sale'],
    },
    {
      name: 'Jurlique Australia',
      url: 'https://jurlique.com.au/',
      catalogs: ['https://jurlique.com.au/collections/sale'],
    },
    {
      name: "Kiehl's Australia",
      url: 'https://www.kiehls.com.au/',
      catalogs: ['https://www.kiehls.com.au/special-offers'],
    },
    {
      name: 'Innisfree Australia',
      url: 'https://au.innisfree.com/',
      catalogs: ['https://au.innisfree.com/pages/stockists'],
    },
    {
      name: 'Nudie Glow Australia',
      url: 'https://nudieglow.com/',
      catalogs: ['https://nudieglow.com/collections/sale'],
    },
    {
      name: 'Myer Beauty Australia',
      url: 'https://www.myer.com.au/c/beauty',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.myer.com.au/c/offers/sale-all/sale-beauty'],
    },
    {
      name: 'David Jones Beauty',
      url: 'https://www.davidjones.com/beauty',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.davidjones.com/sale/beauty'],
    },
    {
      name: 'LUSH Australia',
      url: 'https://www.lush.com/au/en',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.lush.com/au/en/c/sale'],
    },
    {
      name: 'The Body Shop Australia',
      url: 'https://www.thebodyshop.com/en-au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.thebodyshop.com/en-au/sale/c/c00113'],
    },
    {
      name: 'Aesop Australia',
      url: 'https://www.aesop.com/au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Cosmetic Capital',
      url: 'https://www.cosmeticcapital.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.cosmeticcapital.com.au/collections/sale'],
    },
    {
      name: 'BEAUTE KNOWS',
      url: 'https://beauteknows.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: ['https://beauteknows.com.au/collections/sale'],
    },
    {
      name: 'Active Skin',
      url: 'https://www.activeskin.com.au/',
      suburb: 'Newcastle',
      city: 'Newcastle',
      catalogs: ['https://www.activeskin.com.au/sale'],
    },
    {
      name: 'La Cosmetique',
      url: 'https://lacosmetique.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://lacosmetique.com.au/collections/sale'],
    },
    {
      name: 'Cosme Hut Australia',
      url: 'https://cosmehut.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://cosmehut.com.au/collections/sale'],
    },
    {
      name: 'Paula’s Choice Australia',
      url: 'https://www.paulaschoice.com.au/',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: ['https://www.paulaschoice.com.au/special-offers'],
    },
    {
      name: 'MCoBeauty',
      url: 'https://mcobeauty.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://mcobeauty.com.au/collections/sale'],
    },
    {
      name: 'Nude by Nature',
      url: 'https://nudebynature.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://nudebynature.com.au/collections/sale'],
    },
    {
      name: 'Napoleon Perdis',
      url: 'https://napoleonperdis.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://napoleonperdis.com/collections/sale'],
    },
    {
      name: 'KIKO Milano Australia',
      url: 'https://www.kikocosmetics.com/en-au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.kikocosmetics.com/en-au/sale/'],
    },
    {
      name: 'M·A·C Cosmetics Australia',
      url: 'https://www.maccosmetics.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.maccosmetics.com.au/offers'],
    },
    {
      name: 'Estée Lauder Australia',
      url: 'https://www.esteelauder.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.esteelauder.com.au/offers'],
    },
    {
      name: 'Clinique Australia',
      url: 'https://www.clinique.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.clinique.com.au/offers'],
    },
    {
      name: 'Ultra Beauty Australia',
      url: 'https://www.chemistwarehouse.com.au/ultra-beauty',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.chemistwarehouse.com.au/catalogue'],
    },
    {
      name: 'Hairhouse Australia',
      url: 'https://www.hairhouse.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.hairhouse.com.au/sale'],
    },
    {
      name: 'Ascent Luxury Cosmetics Cabramatta',
      url: 'https://ascentluxurycosmetics.com.au/',
      suburb: 'Cabramatta',
      city: 'Sydney',
      catalogs: ['https://ascentluxurycosmetics.com.au/collections/sale'],
    },
    {
      name: 'La Milas Perfume NSW',
      url: 'https://lamilas.com.au/',
      suburb: 'Parramatta',
      city: 'Sydney',
      catalogs: ['https://lamilas.com.au/'],
    },
    {
      name: 'Libertine Parfumerie Chatswood',
      url: 'https://www.libertineparfumerie.com.au/',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: [
        'https://www.libertineparfumerie.com.au/pages/gifts-with-purchase',
        'https://www.libertineparfumerie.com.au/collections/outlet',
      ],
    },
    {
      name: 'Crew Cosmetics Parramatta',
      url: 'https://crewcosmetics.com.au/',
      suburb: 'Parramatta',
      city: 'Sydney',
      catalogs: ['https://crewcosmetics.com.au/prices-drop'],
    },
    {
      name: 'Kimarie Boutique Cabramatta',
      url: 'https://kimarieboutique.com.au/',
      suburb: 'Cabramatta',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: "L'Occitane Sydney",
      url: 'https://au.loccitane.com/special-offers',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://au.loccitane.com/special-offers'],
    },
    {
      name: 'SkincareStore Australia',
      url: 'https://www.skincarestore.com.au/',
      suburb: 'Perth',
      city: 'Perth',
      catalogs: ['https://www.skincarestore.com.au/sale.list'],
    },
  ];

  await Promise.all(
    beautyStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: cosmeticPerfumesCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: cosmeticPerfumesCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const clothingFashionsCategory = categories.find((category) => category.name === 'Clothing & Fashions');

  if (!clothingFashionsCategory) {
    throw new Error('Clothing & Fashions category was not created');
  }

  const clothingFashionStores = [
    {
      name: 'Cotton On Australia',
      url: 'https://cottonon.com/AU/',
      catalogs: ['https://cottonon.com/AU/co/co-sale/'],
    },
    {
      name: 'Seed Heritage',
      url: 'https://www.seedheritage.com/',
      catalogs: ['https://www.seedheritage.com/sale/'],
    },
    {
      name: 'Forever New Australia',
      url: 'https://www.forevernew.com.au/',
      catalogs: ['https://www.forevernew.com.au/sale'],
    },
    {
      name: 'Sportsgirl',
      url: 'https://www.sportsgirl.com.au/',
      catalogs: ['https://www.sportsgirl.com.au/sale'],
    },
    {
      name: 'Sussan',
      url: 'https://www.sussan.com.au/',
      catalogs: ['https://www.sussan.com.au/sale'],
    },
    {
      name: 'Witchery',
      url: 'https://www.witchery.com.au/',
      catalogs: ['https://www.witchery.com.au/sale/'],
    },
    {
      name: 'City Beach Australia',
      url: 'https://www.citybeach.com/au/',
      catalogs: ['https://www.citybeach.com/au/sale'],
    },
    {
      name: 'Just Jeans Australia',
      url: 'https://justjeans.jgl.com.au/',
      catalogs: ['https://justjeans.jgl.com.au/shop/en/justjeans/sale'],
    },
    {
      name: 'Parlour X Paddington',
      url: 'https://www.parlourx.com/',
      suburb: 'Paddington',
      city: 'Sydney',
      catalogs: ['https://www.parlourx.com/collections/sale'],
    },
    {
      name: 'Incu Sydney',
      url: 'https://www.incu.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.incu.com/collections/sale'],
    },
    {
      name: 'The Standard Store Sydney',
      url: 'https://thestandardstore.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://thestandardstore.com.au/collections/sale'],
    },
    {
      name: 'The Archive AU Sydney',
      url: 'https://thearchiveau.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://thearchiveau.com/collections/sale'],
    },
    {
      name: 'Above The Clouds Sydney',
      url: 'https://www.abovethecloudsstore.com/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://www.abovethecloudsstore.com/collections/sale'],
    },
    {
      name: 'Maple Store Newtown',
      url: 'https://maplestore.com.au/',
      suburb: 'Newtown',
      city: 'Sydney',
      catalogs: ['https://maplestore.com.au/collections/sale'],
    },
    {
      name: 'ROAR Cronulla',
      url: 'https://weareroar.com.au/',
      suburb: 'Cronulla',
      city: 'Sydney',
      catalogs: ['https://weareroar.com.au/collections/sale'],
    },
    {
      name: 'Riada Concept Woollahra',
      url: 'https://riadaconcept.com/',
      suburb: 'Woollahra',
      city: 'Sydney',
      catalogs: ['https://riadaconcept.com/collections/all-sale/sale'],
    },
    {
      name: 'Filomena Natale Sydney',
      url: 'https://www.filomenanatale.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.filomenanatale.com.au/clearance'],
    },
    {
      name: 'Rodeo Drive Boutique Merrylands',
      url: 'https://rodeodriveboutique.com.au/',
      suburb: 'Merrylands',
      city: 'Sydney',
      catalogs: ['https://rodeodriveboutique.com.au/product-category/sale/'],
    },
    {
      name: 'Kookla Boutique',
      url: 'https://kooklaboutique.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://kooklaboutique.com.au/collections/sale'],
    },
    {
      name: 'Sorry Thanks I Love You Sydney',
      url: 'https://sorrythanksiloveyou.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://sorrythanksiloveyou.com/collections/sale'],
    },
  ];

  await Promise.all(
    clothingFashionStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: clothingFashionsCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: clothingFashionsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const electronicGadgetsCategory = categories.find((category) => category.name === 'Electronic & Gadgets');

  if (!electronicGadgetsCategory) {
    throw new Error('Electronic & Gadgets category was not created');
  }

  const electronicGadgetStores = [
    {
      name: 'JB Hi-Fi',
      url: 'https://www.jbhifi.com.au/',
      catalogs: [
        'https://www.jbhifi.com.au/collections/all-products-on-sale?page=1',
        'https://www.jbhifi.com.au/collections/hot-deals',
        'https://www.jbhifi.com.au/collections/tvs/hisense-tv-clearance',
        'https://www.jbhifi.com.au/collections/camera-clearance',
      ],
    },
    {
      name: 'Bing Lee',
      url: 'https://www.binglee.com.au/',
      catalogs: [
        'https://www.binglee.com.au/articles/sales/afterpay-day-sale',
        'https://www.binglee.com.au/categories/promotions/hot-tax-time-deals-on-selected-appliances',
        'https://www.binglee.com.au/stores/online-sales',
        'https://www.binglee.com.au/categories/promotions/clearance',
      ],
    },
    {
      name: 'The Good Guys',
      url: 'https://www.thegoodguys.com.au/',
      catalogs: [
        'https://www.thegoodguys.com.au/deals',
        'https://www.thegoodguys.com.au/sale',
      ],
    },
    {
      name: 'Harvey Norman',
      url: 'https://www.harveynorman.com.au/',
      catalogs: [
        'https://www.harveynorman.com.au/clearance/',
        'https://www.harveynorman.com.au/clearance?p=1',
        'https://www.harveynorman.com.au/clearance?p=2',
        'https://www.harveynorman.com.au/sale',
        'https://www.harveynorman.com.au/hot-deals?intcmp=HNAU-7225',
      ],
    },
    {
      name: 'Officeworks',
      url: 'https://www.officeworks.com.au/',
      catalogs: ['https://www.officeworks.com.au/shop/officeworks/c/sale'],
    },
    {
      name: 'Kogan Australia',
      url: 'https://www.kogan.com/au/',
      catalogs: ['https://www.kogan.com/au/deals/'],
    },
    {
      name: 'Appliances Online',
      url: 'https://www.appliancesonline.com.au/',
      catalogs: ['https://www.appliancesonline.com.au/sale/'],
    },
    {
      name: 'Retravision',
      url: 'https://www.retravision.com.au/',
      catalogs: ['https://www.retravision.com.au/promotions'],
    },
    {
      name: 'Scorptec',
      url: 'https://www.scorptec.com.au/',
      catalogs: ['https://www.scorptec.com.au/specials'],
    },
    {
      name: 'Mwave Australia',
      url: 'https://www.mwave.com.au/',
      catalogs: ['https://www.mwave.com.au/hot-deals'],
    },
  ];

  await Promise.all(
    electronicGadgetStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: electronicGadgetsCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: electronicGadgetsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const babyKidsCategory = categories.find((category) => category.name === 'Baby & Kids');

  if (!babyKidsCategory) {
    throw new Error('Baby & Kids category was not created');
  }

  const babyKidsStores = [
    {
      name: 'Riff Raff Baby AU',
      url: 'https://au.riffraffbaby.com/',
      catalogs: ['https://au.riffraffbaby.com/collections/all'],
    },
    {
      name: 'BIG W Baby',
      url: 'https://www.bigw.com.au/baby',
      catalogs: ['https://www.bigw.com.au/baby-sale'],
    },
    {
      name: 'Target Australia Baby',
      url: 'https://www.target.com.au/baby',
      catalogs: ['https://www.target.com.au/c/baby/'],
    },
    {
      name: 'Kmart Australia Baby',
      url: 'https://www.kmart.com.au/category/baby/',
      catalogs: ['https://www.kmart.com.au/category/baby/baby-sale/'],
    },
    {
      name: 'Baby Bunting',
      url: 'https://babybunting.com.au',
      catalogs: [
        'https://www.babybunting.com.au/sale',
        'https://www.babybunting.com.au/sale/clearance',
      ],
    },
    {
      name: 'Baby Warehouse Australia',
      url: 'https://babywarehouse.com.au/',
      catalogs: ['https://babywarehouse.com.au/collections/frontpage'],
    },
    {
      name: 'Baby Kingdom',
      url: 'https://www.babykingdom.com.au/',
      catalogs: ['https://www.babykingdom.com.au/collections/sale'],
    },
    {
      name: 'Baby Village',
      url: 'https://www.babyvillage.com.au/',
      catalogs: ['https://www.babyvillage.com.au/collections/sale'],
    },
    {
      name: 'Metro Baby',
      url: 'https://metro-baby.com.au/',
      catalogs: ['https://metro-baby.com.au/collections/sale'],
    },
    {
      name: 'The Memo',
      url: 'https://thememo.com.au/',
      catalogs: ['https://thememo.com.au/collections/sale'],
    },
    {
      name: 'Bubs n Grubs',
      url: 'https://www.bubsngrubs.com.au/',
      catalogs: [],
    },
    {
      name: 'Baby Direct Australia',
      url: 'https://baby-direct.com.au/',
      catalogs: ['https://baby-direct.com.au/pages/sale'],
    },
    {
      name: 'Purebaby',
      url: 'https://purebaby.com.au/',
      catalogs: ['https://purebaby.com.au/collections/sale'],
    },
    {
      name: 'Bonds Baby & Kids',
      url: 'https://www.bonds.com.au/baby.html',
      catalogs: ['https://www.bonds.com.au/sale.html'],
    },
    {
      name: 'Toymate',
      url: 'https://toymate.com.au/',
      catalogs: ['https://toymate.com.au/sale'],
    },
    {
      name: 'Kidstuff',
      url: 'https://www.kidstuff.com.au/',
      catalogs: ['https://www.kidstuff.com.au/collections/sale'],
    },
    {
      name: 'Cotton On Kids',
      url: 'https://cottonon.com/AU/kids/',
      catalogs: ['https://cottonon.com/AU/kids/kids-sale/'],
    },
    {
      name: 'Best&Less Baby & Kids',
      url: 'https://www.bestandless.com.au/collections/baby',
      catalogs: [
        'https://www.bestandless.com.au/collections/baby-sale',
        'https://www.bestandless.com.au/collections/kids-sale',
      ],
    },
    {
      name: 'Seed Heritage Child',
      url: 'https://www.seedheritage.com/au/child/',
      catalogs: ['https://www.seedheritage.com/au/sale/child/'],
    },
    {
      name: 'Huxbaby',
      url: 'https://www.huxbaby.com/',
      catalogs: ['https://www.huxbaby.com/collections/sale'],
    },
  ];

  await Promise.all(
    babyKidsStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: babyKidsCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: babyKidsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const luxuryDesignerCategory = categories.find((category) => category.name === 'Luxury & Designer');

  if (!luxuryDesignerCategory) {
    throw new Error('Luxury & Designer category was not created');
  }

  const luxuryDesignerStores = [
    {
      name: 'Gucci Australia',
      url: 'https://www.gucci.com/au/en_au/',
      catalogs: [],
    },
    {
      name: 'Miu Miu Australia',
      url: 'https://www.miumiu.com/au/en.html',
      catalogs: [],
    },
    {
      name: 'Saint Laurent Australia',
      url: 'https://www.ysl.com/en-au',
      catalogs: [],
    },
    {
      name: 'Aje Australia',
      url: 'https://ajeworld.com.au/',
      catalogs: ['https://ajeworld.com.au/collections/sale-edit'],
    },
    {
      name: 'TOM FORD Australia',
      url: 'https://www.tomford.com/',
      catalogs: [],
    },
    {
      name: 'EA7 Emporio Armani Australia',
      url: 'https://www.armani.com/en-au/ea7/',
      catalogs: ['https://www.armani.com/en-au/ea7/sale/'],
    },
    {
      name: 'Prada Australia',
      url: 'https://www.prada.com/au/en.html',
      catalogs: [],
    },
    {
      name: 'Farfetch Australia Designer Sale',
      url: 'https://www.farfetch.com/au/',
      catalogs: ['https://www.farfetch.com/au/shopping/women/sale/all/items.aspx'],
    },
    {
      name: 'David Jones Designer Sale',
      url: 'https://www.davidjones.com/',
      catalogs: ['https://www.davidjones.com/sale/designer-sale'],
    },
  ];

  await Promise.all(
    luxuryDesignerStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: luxuryDesignerCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: luxuryDesignerCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const hifiAudioSpeakersCategory = categories.find((category) => category.name === 'HIFI Audio & Speakers');

  if (!hifiAudioSpeakersCategory) {
    throw new Error('HIFI Audio & Speakers category was not created');
  }

  const hifiAudioSpeakerStores = [
    {
      name: 'Bowers & Wilkins Australia',
      url: 'https://www.bowerswilkins.com/en-au/',
      catalogs: ['https://www.bowerswilkins.com/en-au/category/sale/'],
    },
    {
      name: 'Bang & Olufsen Australia',
      url: 'https://www.bang-olufsen.com/en/au',
      catalogs: ['https://www.bang-olufsen.com/en/au/exclusive-offers'],
    },
    {
      name: 'KEF Australia',
      url: 'https://au.kef.com/',
      catalogs: [],
    },
    {
      name: 'Bose Australia',
      url: 'https://www.bose.com.au/',
      catalogs: ['https://www.bose.com.au/c/sale'],
    },
    {
      name: 'Arcam at Digital Cinema',
      url: 'https://www.digitalcinema.com.au/arcam/',
      catalogs: ['https://www.digitalcinema.com.au/arcam/'],
    },
    {
      name: 'Cambridge Audio at Addicted To Audio',
      url: 'https://addictedtoaudio.com.au/collections/cambridge-audio',
      catalogs: [
        'https://addictedtoaudio.com.au/collections/cambridge-audio',
        'https://addictedtoaudio.com.au/products/cambridge-audio-melomania-m100-true-wireless-headphones-black',
        'https://addictedtoaudio.com.au/products/cambridge-audio-mxn10-network-audio-player',
        'https://addictedtoaudio.com.au/products/cambridge-audio-duo-moving-coil-moving-magnet-phono-preamplifier',
        'https://addictedtoaudio.com.au/collections/sale',
        'https://addictedtoaudio.com.au/collections/clearance',
      ],
    },
    {
      name: 'Rega at Vision Hifi',
      url: 'https://www.visionhifi.com.au/brand/rega',
      catalogs: ['https://www.visionhifi.com.au/brand/rega'],
    },
    {
      name: 'CHT Solutions HiFi',
      url: 'https://www.customht.com.au/collections/hifi',
      catalogs: ['https://www.customht.com.au/collections/hifi'],
    },
    {
      name: 'Sydney Hi-Fi Castle Hill',
      url: 'https://www.sydneyhificastlehill.com.au/',
      catalogs: ['https://www.sydneyhificastlehill.com.au/product/floor-stock-ex-demo-trade-in-and-consignment-list/'],
    },
    {
      name: 'HiFi HQ Australia',
      url: 'https://hifihq.com.au/',
      catalogs: ['https://hifihq.com.au/category/Clearance-Home-Audio'],
    },
  ];

  await Promise.all(
    hifiAudioSpeakerStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: hifiAudioSpeakersCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: hifiAudioSpeakersCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const entertainmentEventsCategory = categories.find((category) => category.name === 'Entertainment & Events');

  if (!entertainmentEventsCategory) {
    throw new Error('Entertainment & Events category was not created');
  }

  const entertainmentEventStores = [
    {
      name: 'Event Cinemas Australia',
      url: 'https://www.eventcinemas.com.au/',
      catalogs: [
        'https://www.eventcinemas.com.au/Promotions',
        'https://www.eventcinemas.com.au/cinebuzz/landing',
      ],
    },
    {
      name: 'HOYTS Australia',
      url: 'https://www.hoyts.com.au/',
      catalogs: ['https://www.hoyts.com.au/offers-events'],
    },
    {
      name: 'Palace Cinemas Australia',
      url: 'https://www.palacecinemas.com.au/',
      catalogs: ['https://www.palacecinemas.com.au/offers/'],
    },
    {
      name: 'Ticketek Australia',
      url: 'https://www.ticketek.com/',
      catalogs: [],
    },
    {
      name: 'Ticketmaster Australia',
      url: 'https://www.ticketmaster.com.au/',
      catalogs: [],
    },
    {
      name: 'TIX Australia',
      url: 'https://tix.com.au/',
      catalogs: ['https://tix.com.au/'],
    },
    {
      name: 'Sydney Opera House',
      url: 'https://www.sydneyoperahouse.com/',
      catalogs: ['https://www.sydneyoperahouse.com/events'],
    },
    {
      name: 'Opera Australia Special Offers',
      url: 'https://opera.org.au/',
      catalogs: ['https://opera.org.au/buy/special-offers/'],
    },
    {
      name: 'ICC Sydney',
      url: 'https://iccsydney.com.au/',
      catalogs: ['https://iccsydney.com.au/events/'],
    },
    {
      name: 'Moshtix Australia',
      url: 'https://www.moshtix.com.au/',
      catalogs: [],
    },
    {
      name: 'Oztix Australia',
      url: 'https://tickets.oztix.com.au/',
      catalogs: [],
    },
  ];

  await Promise.all(
    entertainmentEventStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: entertainmentEventsCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: entertainmentEventsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const giftsFlowersCategory = categories.find((category) => category.name === 'Gifts & Flowers');

  if (!giftsFlowersCategory) {
    throw new Error('Gifts & Flowers category was not created');
  }

  const giftsFlowerStores = [
    {
      name: 'Interflora Australia',
      url: 'https://www.interflora.com.au/',
      catalogs: [],
    },
    {
      name: 'Fig & Bloom',
      url: 'https://figandbloom.com/',
      catalogs: ['https://figandbloom.com/pages/offer_page'],
    },
    {
      name: 'Daily Blooms',
      url: 'https://dailyblooms.com.au/',
      catalogs: [],
    },
    {
      name: 'Flowers Across Australia',
      url: 'https://www.flowersacross.com.au/',
      catalogs: [],
    },
    {
      name: 'LVLY Australia',
      url: 'https://www.lvly.com.au/',
      catalogs: [],
    },
    {
      name: 'The Hamper Emporium',
      url: 'https://www.thehamperemporium.com.au/',
      catalogs: ['https://www.thehamperemporium.com.au/collections/25-off-selected-hampers'],
    },
    {
      name: 'Edible Blooms',
      url: 'https://www.edibleblooms.com.au/',
      catalogs: ['https://www.edibleblooms.com.au/pages/shop-by-category'],
    },
    {
      name: 'Gifts Australia',
      url: 'https://www.giftsaustralia.com.au/',
      catalogs: ['https://www.giftsaustralia.com.au/clearance'],
    },
    {
      name: 'Hardtofind Australia',
      url: 'https://www.hardtofind.com.au/',
      catalogs: ['https://www.hardtofind.com.au/sale'],
    },
    {
      name: 'The Gifting Emporium',
      url: 'https://thegiftingemporium.com.au/',
      catalogs: ['https://thegiftingemporium.com.au/shop/'],
    },
  ];

  await Promise.all(
    giftsFlowerStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: giftsFlowersCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: giftsFlowersCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const travelAccommodationCategory = categories.find((category) => category.name === 'Travel & Accommodation');

  if (!travelAccommodationCategory) {
    throw new Error('Travel & Accommodation category was not created');
  }

  const travelAccommodationStores = [
    {
      name: 'Jetstar Holidays',
      url: 'https://www.jetstar.com/au/en/holidays',
      catalogs: ['https://www.jetstar.com/au/en/holidays/deals'],
    },
    {
      name: 'Virgin Australia Holidays',
      url: 'https://www.virginaustralia.com/au/en/holidays/',
      catalogs: ['https://www.virginaustralia.com/au/en/specials/'],
    },
    {
      name: 'Qantas Holidays',
      url: 'https://www.qantas.com/holidays',
      catalogs: [
        'https://www.qantas.com/holidays/deal',
        'https://www.qantas.com/holidays/deals/fly-stay-deals',
        'https://www.qantas.com/holidays/special-offers',
      ],
    },
    {
      name: 'Luxury Escapes Australia',
      url: 'https://luxuryescapes.com/au',
      catalogs: ['https://luxuryescapes.com/au/offer'],
    },
    {
      name: 'Flight Centre Australia',
      url: 'https://www.flightcentre.com.au/',
      catalogs: ['https://www.flightcentre.com.au/deals'],
    },
    {
      name: 'Webjet Australia',
      url: 'https://www.webjet.com.au/',
      catalogs: ['https://www.webjet.com.au/specials/'],
    },
    {
      name: 'Wotif Australia',
      url: 'https://www.wotif.com/',
      catalogs: ['https://www.wotif.com/lp/deals'],
    },
    {
      name: 'Expedia Australia',
      url: 'https://www.expedia.com.au/',
      catalogs: ['https://www.expedia.com.au/lp/deals'],
    },
    {
      name: 'Accor Australia Offers',
      url: 'https://all.accor.com/a/en.html',
      catalogs: [
        'https://all.accor.com/a/en.html',
        'https://all.accor.com/a/en/offers.html',
      ],
    },
    {
      name: 'IHG Australia Offers',
      url: 'https://www.ihg.com/hotels/gb/en/reservation',
      catalogs: ['https://www.ihg.com/content/gb/en/deals/hotel-offers'],
    },
    {
      name: 'Singapore Airlines Australia',
      url: 'https://www.singaporeair.com/en_UK/au/home',
      catalogs: ['https://www.singaporeair.com/en_UK/au/plan-travel/promotions/'],
    },
    {
      name: 'Emirates Australia',
      url: 'https://www.emirates.com/au/english/',
      catalogs: ['https://www.emirates.com/au/english/special-offers/'],
    },
    {
      name: 'Qatar Airways Australia',
      url: 'https://www.qatarairways.com/en-au/homepage.html',
      catalogs: ['https://www.qatarairways.com/en-au/offers.html'],
    },
    {
      name: 'Etihad Airways Australia',
      url: 'https://www.etihad.com/en-au/',
      catalogs: ['https://www.etihad.com/en-au/deals'],
    },
    {
      name: 'Cathay Pacific Australia',
      url: 'https://www.cathaypacific.com/cx/en_AU.html',
      catalogs: ['https://www.cathaypacific.com/cx/en_AU/offers.html'],
    },
    {
      name: 'Thai Airways Australia',
      url: 'https://www.thaiairways.com/en_AU/index.page',
      catalogs: ['https://www.thaiairways.com/en_AU/plan/travel_information/promotions.page'],
    },
    {
      name: 'Air New Zealand Australia',
      url: 'https://www.airnewzealand.com.au/',
      catalogs: ['https://www.airnewzealand.com.au/special-deals'],
    },
    {
      name: 'United Airlines Australia',
      url: 'https://www.united.com/en/au',
      catalogs: ['https://www.united.com/en/au/fly/deals.html'],
    },
    {
      name: 'Korean Air Australia',
      url: 'https://www.koreanair.com/au/en',
      catalogs: ['https://www.koreanair.com/au/en/promotion/list'],
    },
    {
      name: 'Japan Airlines Australia',
      url: 'https://www.jal.co.jp/ar/en/',
      catalogs: ['https://www.jal.co.jp/ar/en/deals/'],
    },
    {
      name: 'ANA Australia',
      url: 'https://www.ana.co.jp/en/au/',
      catalogs: ['https://www.ana.co.jp/en/au/promotions/'],
    },
    {
      name: 'Malaysia Airlines Australia',
      url: 'https://www.malaysiaairlines.com/au/en.html',
      catalogs: ['https://www.malaysiaairlines.com/au/en/deals.html'],
    },
    {
      name: 'Fiji Airways Australia',
      url: 'https://www.fijiairways.com/en-au/',
      catalogs: ['https://www.fijiairways.com/en-au/flights/special-offers'],
    },
  ];

  await Promise.all(
    travelAccommodationStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: travelAccommodationCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: travelAccommodationCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const vitaminsSupplementsCategory = categories.find((category) => category.name === 'Vitamins & Supplements');

  if (!vitaminsSupplementsCategory) {
    throw new Error('Vitamins & Supplements category was not created');
  }

  const vitaminSupplementStores = [
    {
      name: 'Chemist Warehouse Vitamins',
      url: 'https://www.chemistwarehouse.com.au/shop-online/81/vitamins-supplements',
      catalogs: ['https://www.chemistwarehouse.com.au/catalogue'],
    },
    {
      name: 'Priceline Vitamins',
      url: 'https://www.priceline.com.au/vitamins',
      catalogs: ['https://www.priceline.com.au/c/sale/'],
    },
    {
      name: 'Woolworths Health & Wellness Specials',
      url: 'https://www.woolworths.com.au/shop/browse/health-wellness',
      catalogs: [
        'https://www.woolworths.com.au/shop/browse/specials',
        'https://catalogues.woolworths.com.au/',
      ],
    },
    {
      name: 'Coles Vitamins & Health Specials',
      url: 'https://www.coles.com.au/browse/health-beauty/vitamins',
      catalogs: [
        'https://www.coles.com.au/on-special',
        'https://www.coles.com.au/catalogues-and-specials',
      ],
    },
    {
      name: 'Nutrition Warehouse',
      url: 'https://www.nutritionwarehouse.com.au/',
      catalogs: ['https://www.nutritionwarehouse.com.au/pages/clearance-supplements'],
    },
    {
      name: 'Healthy Life Australia',
      url: 'https://www.healthylife.com.au/',
      catalogs: ['https://www.healthylife.com.au/sale'],
    },
    {
      name: 'Mr Vitamins',
      url: 'https://www.mrvitamins.com.au/',
      catalogs: ['https://www.mrvitamins.com.au/collections/sale'],
    },
    {
      name: 'Go Vita Australia',
      url: 'https://www.govita.com.au/',
      catalogs: ['https://www.govita.com.au/specials'],
    },
    {
      name: 'iHerb Australia',
      url: 'https://au.iherb.com/',
      catalogs: ['https://au.iherb.com/specials'],
    },
  ];

  await Promise.all(
    vitaminSupplementStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: vitaminsSupplementsCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: vitaminsSupplementsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const officeStationeryCategory = categories.find((category) => category.name === 'Office & Stationery');

  if (!officeStationeryCategory) {
    throw new Error('Office & Stationery category was not created');
  }

  const officeStationeryStores = [
    {
      name: 'Officeworks Office & Stationery',
      url: 'https://www.officeworks.com.au/shop/officeworks/c/office-supplies',
      catalogs: ['https://www.officeworks.com.au/shop/officeworks/c/deals'],
    },
    {
      name: 'Winc Australia',
      url: 'https://www.winc.com.au/',
      catalogs: ['https://www.winc.com.au/shop/sale'],
    },
    {
      name: 'Kmart Office & Stationery',
      url: 'https://www.kmart.com.au/category/home-office-and-stationery/',
      catalogs: ['https://www.kmart.com.au/category/clearance/'],
    },
    {
      name: 'BIG W Stationery',
      url: 'https://www.bigw.com.au/office-stationery',
      catalogs: ['https://www.bigw.com.au/deals'],
    },
    {
      name: 'Typo Australia',
      url: 'https://typo.com/AU/',
      catalogs: ['https://typo.com/AU/outlet/'],
    },
    {
      name: 'Smiggle Australia',
      url: 'https://www.smiggle.com.au/',
      catalogs: ['https://www.smiggle.com.au/shop/en/smiggle/search/Sale'],
    },
    {
      name: "Eckersley's Art & Craft",
      url: 'https://www.eckersleys.com.au/',
      catalogs: ['https://www.eckersleys.com.au/sale'],
    },
    {
      name: 'Milligram',
      url: 'https://milligram.com/',
      catalogs: ['https://milligram.com/collections/sale'],
    },
    {
      name: 'Australia Post Stationery',
      url: 'https://auspost.com.au/shop/stationery',
      catalogs: ['https://auspost.com.au/shop/sale'],
    },
  ];

  await Promise.all(
    officeStationeryStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: officeStationeryCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: officeStationeryCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const gamesCategory = categories.find((category) => category.name === 'Games');

  if (!gamesCategory) {
    throw new Error('Games category was not created');
  }

  const gameStores = [
    {
      name: 'EB Games Australia',
      url: 'https://www.ebgames.com.au/',
      catalogs: ['https://www.ebgames.com.au/stores/store/1160-sale'],
    },
    {
      name: 'JB Hi-Fi Games',
      url: 'https://www.jbhifi.com.au/collections/hot-deals-on-games',
      catalogs: ['https://www.jbhifi.com.au/collections/hot-deals-on-games'],
    },
    {
      name: 'PlayStation Store Australia Deals',
      url: 'https://store.playstation.com/en-au',
      catalogs: ['https://store.playstation.com/en-au/deals'],
    },
    {
      name: 'Xbox Australia Deals',
      url: 'https://www.xbox.com/en-AU/games/all-games',
      catalogs: ['https://www.xbox.com/en-AU/promotions/sales/sales-and-specials'],
    },
    {
      name: 'Nintendo Store Australia',
      url: 'https://store.nintendo.com.au/',
      catalogs: ['https://store.nintendo.com.au/sale'],
    },
    {
      name: 'Steam Australia Specials',
      url: 'https://store.steampowered.com/?cc=au',
      catalogs: ['https://store.steampowered.com/search/?specials=1&cc=au'],
    },
    {
      name: 'The Gamesmen',
      url: 'https://www.gamesmen.com.au/',
      catalogs: ['https://www.gamesmen.com.au/sale'],
    },
    {
      name: 'Mighty Ape Australia Games',
      url: 'https://www.mightyape.com.au/games',
      catalogs: ['https://www.mightyape.com.au/sales'],
    },
  ];

  await Promise.all(
    gameStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: gamesCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: gamesCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const trendingToysCategory = categories.find((category) => category.name === 'Trending Toys');

  if (!trendingToysCategory) {
    throw new Error('Trending Toys category was not created');
  }

  const trendingToyStores = [
    {
      name: 'Toyworld Australia',
      url: 'https://www.toyworld.com.au/',
      catalogs: ['https://www.toyworld.com.au/pages/toyworld-sale'],
    },
    {
      name: 'BIG W Toys',
      url: 'https://www.bigw.com.au/toys',
      catalogs: ['https://www.bigw.com.au/deals/toys'],
    },
    {
      name: 'Kmart Toys',
      url: 'https://www.kmart.com.au/category/toys/',
      catalogs: ['https://www.kmart.com.au/category/toys/toys-clearance/'],
    },
    {
      name: 'Target Australia Toys',
      url: 'https://www.target.com.au/toys',
      catalogs: ['https://www.target.com.au/c/toys/'],
    },
    {
      name: 'Amazon Australia Toys',
      url: 'https://www.amazon.com.au/toys-games/b?ie=UTF8&node=4851626051',
      catalogs: ['https://www.amazon.com.au/deals?node=4851626051'],
    },
    {
      name: 'LEGO Australia',
      url: 'https://www.lego.com/en-au',
      catalogs: ['https://www.lego.com/en-au/categories/sales-and-deals'],
    },
    {
      name: 'Toys R Us Australia',
      url: 'https://www.toysrus.com.au/',
      catalogs: ['https://www.toysrus.com.au/collections/sale'],
    },
    {
      name: 'Toymate Australia',
      url: 'https://toymate.com.au/',
      catalogs: ['https://toymate.com.au/collections/sale'],
    },
    {
      name: 'Kidstuff Australia',
      url: 'https://www.kidstuff.com.au/',
      catalogs: ['https://www.kidstuff.com.au/collections/sale'],
    },
    {
      name: 'Robotime Australia',
      url: 'https://robotime.com.au/',
      catalogs: ['https://robotime.com.au/collections/sale'],
    },
  ];

  await Promise.all(
    trendingToyStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: trendingToysCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: trendingToysCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const toolsDiyCategory = categories.find((category) => category.name === 'Tools & DIY');

  if (!toolsDiyCategory) {
    throw new Error('Tools & DIY category was not created');
  }

  const toolsDiyStores = [
    {
      name: 'Bunnings Tools & DIY',
      url: 'https://www.bunnings.com.au/products/tools',
      catalogs: ['https://www.bunnings.com.au/special-orders'],
    },
    {
      name: 'IKEA Australia Offers',
      url: 'https://www.ikea.com/au/en/',
      catalogs: ['https://www.ikea.com/au/en/offers/'],
    },
    {
      name: 'Mitre 10 Australia',
      url: 'https://www.mitre10.com.au/',
      catalogs: ['https://www.mitre10.com.au/catalogues'],
    },
    {
      name: 'Total Tools Australia',
      url: 'https://www.totaltools.com.au/',
      catalogs: [
        'https://www.totaltools.com.au/clearance',
        'https://www.totaltools.com.au/tool-flash-sale',
      ],
    },
    {
      name: 'Sydney Tools',
      url: 'https://sydneytools.com.au/',
      catalogs: ['https://sydneytools.com.au/sale'],
    },
    {
      name: 'Tool Kit Depot',
      url: 'https://www.toolkitdepot.com.au/',
      catalogs: ['https://www.toolkitdepot.com.au/sale/'],
    },
    {
      name: 'Supercheap Auto Tools',
      url: 'https://www.supercheapauto.com.au/tools-garage',
      catalogs: ['https://www.supercheapauto.com.au/sale'],
    },
    {
      name: 'Repco Tools',
      url: 'https://www.repco.com.au/tools-equipment',
      catalogs: ['https://www.repco.com.au/sale'],
    },
    {
      name: 'Blackwoods Tools',
      url: 'https://www.blackwoods.com.au/tools',
      catalogs: ['https://www.blackwoods.com.au/sale'],
    },
    {
      name: 'TradeTools Australia',
      url: 'https://www.tradetools.com/',
      catalogs: ['https://www.tradetools.com/sale'],
    },
  ];

  await Promise.all(
    toolsDiyStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: toolsDiyCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: toolsDiyCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const homeGardenCategory = categories.find((category) => category.name === 'Home & Garden');

  if (!homeGardenCategory) {
    throw new Error('Home & Garden category was not created');
  }

  const homeGardenStores = [
    {
      name: 'Bunnings Garden',
      url: 'https://www.bunnings.com.au/products/garden',
      catalogs: [
        'https://www.bunnings.com.au/products/garden',
        'https://www.bunnings.com.au/special-orders',
      ],
    },
    {
      name: 'IKEA Home & Garden Australia',
      url: 'https://www.ikea.com/au/en/rooms/',
      catalogs: ['https://www.ikea.com/au/en/offers/'],
    },
    {
      name: 'Temple & Webster',
      url: 'https://www.templeandwebster.com.au/',
      catalogs: [
        'https://www.templeandwebster.com.au/Sale-C613972.html',
        'https://www.templeandwebster.com.au/clearance',
      ],
    },
    {
      name: 'Freedom Furniture',
      url: 'https://www.freedom.com.au/',
      catalogs: ['https://www.freedom.com.au/sale'],
    },
    {
      name: 'Fantastic Furniture',
      url: 'https://www.fantasticfurniture.com.au/',
      catalogs: ['https://www.fantasticfurniture.com.au/Categories/Sale/c/Sale'],
    },
    {
      name: 'Amart Furniture',
      url: 'https://www.amartfurniture.com.au/',
      catalogs: ['https://www.amartfurniture.com.au/sale/'],
    },
    {
      name: 'Adairs Australia',
      url: 'https://www.adairs.com.au/',
      catalogs: ['https://www.adairs.com.au/sale/'],
    },
    {
      name: 'Spotlight Home',
      url: 'https://www.spotlightstores.com/home',
      catalogs: ['https://www.spotlightstores.com/sale'],
    },
    {
      name: "Bed Bath N' Table",
      url: 'https://www.bedbathntable.com.au/',
      catalogs: ['https://www.bedbathntable.com.au/clearance-online'],
    },
    {
      name: 'Harris Scarfe Home',
      url: 'https://www.harrisscarfe.com.au/home',
      catalogs: [
        'https://www.harrisscarfe.com.au/home/sale',
        'https://www.harrisscarfe.com.au/sale-offers',
      ],
    },
    {
      name: 'MyHouse Australia',
      url: 'https://myhouse.com.au/',
      catalogs: ['https://myhouse.com.au/collections/sale'],
    },
    {
      name: 'House Australia',
      url: 'https://www.house.com.au/',
      catalogs: ['https://www.house.com.au/sale'],
    },
    {
      name: 'Flower Power Garden Centre',
      url: 'https://www.flowerpower.com.au/',
      catalogs: ['https://www.flowerpower.com.au/sale'],
    },
    {
      name: 'Domayne Home',
      url: 'https://www.domayne.com.au/',
      catalogs: ['https://www.domayne.com.au/sale'],
    },
    {
      name: 'Nick Scali Furniture',
      url: 'https://www.nickscali.com.au/',
      catalogs: ['https://www.nickscali.com.au/sale'],
    },
  ];

  await Promise.all(
    homeGardenStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: homeGardenCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: homeGardenCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const booksMagazinesCategory = categories.find((category) => category.name === 'Books & Magazines');

  if (!booksMagazinesCategory) {
    throw new Error('Books & Magazines category was not created');
  }

  const booksMagazineStores = [
    {
      name: 'Booktopia Australia',
      url: 'https://www.booktopia.com.au/',
      catalogs: ['https://www.booktopia.com.au/discount-books/promo.html'],
    },
    {
      name: 'Dymocks Australia',
      url: 'https://www.dymocks.com.au/',
      catalogs: ['https://www.dymocks.com.au/specials', 'https://www.dymocks.com.au/books/sale'],
    },
    {
      name: 'QBD Books Australia',
      url: 'https://www.qbd.com.au/',
      catalogs: ['https://www.qbd.com.au/sale/'],
    },
    {
      name: 'Readings Australia',
      url: 'https://www.readings.com.au/',
      catalogs: ['https://www.readings.com.au/specials'],
    },
    {
      name: 'Angus & Robertson Australia',
      url: 'https://www.angusrobertson.com.au/',
      catalogs: ['https://www.angusrobertson.com.au/sale'],
    },
    {
      name: 'Magshop Australia',
      url: 'https://www.magshop.com.au/',
      catalogs: ['https://www.magshop.com.au/on-sale'],
    },
    {
      name: 'isubscribe Australia',
      url: 'https://www.isubscribe.com.au/',
      catalogs: ['https://www.isubscribe.com.au/special-offers'],
    },
    {
      name: 'Kinokuniya Australia',
      url: 'https://www.kinokuniya.com.au/',
      catalogs: ['https://www.kinokuniya.com.au/sale'],
    },
    {
      name: 'The Nile Books Australia',
      url: 'https://www.thenile.com.au/books',
      catalogs: ['https://www.thenile.com.au/specials'],
    },
    {
      name: 'Better Read Than Dead',
      url: 'https://www.betterread.com.au/',
      catalogs: ['https://www.betterread.com.au/sale'],
    },
  ];

  await Promise.all(
    booksMagazineStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: booksMagazinesCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: booksMagazinesCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const carsAccessoriesCategory = categories.find((category) => category.name === 'Cars Accessories');

  if (!carsAccessoriesCategory) {
    throw new Error('Cars Accessories category was not created');
  }

  const carAccessoryStores = [
    {
      name: 'Supercheap Auto Car Accessories',
      url: 'https://www.supercheapauto.com.au/parts-accessories',
      catalogs: ['https://www.supercheapauto.com.au/sale'],
    },
    {
      name: 'Autobarn Australia',
      url: 'https://www.autobarn.com.au/',
      catalogs: ['https://www.autobarn.com.au/sale'],
    },
    {
      name: 'Repco Car Accessories',
      url: 'https://www.repco.com.au/car-care-panel',
      catalogs: ['https://www.repco.com.au/on-sale'],
    },
    {
      name: 'Sparesbox Australia',
      url: 'https://www.sparesbox.com.au/',
      catalogs: ['https://www.sparesbox.com.au/sale'],
    },
    {
      name: 'Auto One Australia',
      url: 'https://www.autoone.com.au/',
      catalogs: ['https://www.autoone.com.au/sale'],
    },
    {
      name: 'Automotive Superstore',
      url: 'https://automotivesuperstore.com.au/home',
      catalogs: ['https://automotivesuperstore.com.au/sale'],
    },
    {
      name: 'Car Mods Australia',
      url: 'https://www.carmodsaustralia.com.au/',
      catalogs: ['https://www.carmodsaustralia.com.au/sale'],
    },
    {
      name: 'FitMyCar Australia',
      url: 'https://www.fitmycar.com/au/',
      catalogs: ['https://www.fitmycar.com/au/sale'],
    },
    {
      name: '4WD Supacentre',
      url: 'https://www.4wdsupacentre.com.au/',
      catalogs: ['https://www.4wdsupacentre.com.au/sale'],
    },
    {
      name: 'ARB Australia',
      url: 'https://www.arb.com.au/',
      catalogs: ['https://www.arb.com.au/offers/'],
    },
    {
      name: 'Autobox Australia',
      url: 'https://www.autobox.com.au/',
      catalogs: ['https://www.autobox.com.au/sale'],
    },
  ];

  await Promise.all(
    carAccessoryStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: carsAccessoriesCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: carsAccessoriesCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const businessAttireCategory = categories.find((category) => category.name === 'Business Attire');

  if (!businessAttireCategory) {
    throw new Error('Business Attire category was not created');
  }

  const businessAttireStores = [
    {
      name: 'M.J. Bale Business Attire',
      url: 'https://www.mjbale.com/collections/suits',
      catalogs: ['https://www.mjbale.com/collections/sale'],
    },
    {
      name: 'Oxford Business Attire',
      url: 'https://www.oxfordshop.com.au/collections/mens-suits',
      catalogs: ['https://www.oxfordshop.com.au/collections/mens-outlet-suits'],
    },
    {
      name: 'Peter Jackson Menswear',
      url: 'https://www.peterjacksons.com/',
      catalogs: ['https://www.peterjacksons.com/collections/sale'],
    },
    {
      name: 'Politix Business Attire',
      url: 'https://www.politix.com.au/suits/',
      catalogs: ['https://www.politix.com.au/sale/'],
    },
    {
      name: 'Calibre Business Attire',
      url: 'https://www.calibre.com.au/collections/suiting',
      catalogs: ['https://www.calibre.com.au/collections/sale'],
    },
    {
      name: 'Charles Tyrwhitt Australia',
      url: 'https://www.charlestyrwhitt.com/au/home',
      catalogs: ['https://www.charlestyrwhitt.com/au/sale/'],
    },
    {
      name: 'Rodd & Gunn Business Attire',
      url: 'https://www.roddandgunn.com/au/clothing/blazers',
      catalogs: ['https://www.roddandgunn.com/au/sale'],
    },
    {
      name: 'Tarocash Suits',
      url: 'https://www.tarocash.com.au/au/clothing/suits',
      catalogs: ['https://www.tarocash.com.au/au/sale'],
    },
    {
      name: 'Connor Business Attire',
      url: 'https://www.connor.com.au/au/clothing/suits',
      catalogs: ['https://www.connor.com.au/au/sale'],
    },
    {
      name: 'yd. Australia Business Attire',
      url: 'https://www.yd.com.au/au/clothing/suits',
      catalogs: ['https://www.yd.com.au/au/sale'],
    },
  ];

  await Promise.all(
    businessAttireStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: businessAttireCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: businessAttireCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const leatherJacketsBagsCategory = categories.find((category) => category.name === 'Leather Jackets & Bags');

  if (!leatherJacketsBagsCategory) {
    throw new Error('Leather Jackets & Bags category was not created');
  }

  const leatherJacketBagStores = [
    {
      name: 'Oroton Outlet',
      url: 'https://oroton.com/outlet/',
      catalogs: ['https://oroton.com/outlet/'],
    },
    {
      name: 'Strandbags Handbags',
      url: 'https://www.strandbags.com.au/collections/handbags',
      catalogs: ['https://www.strandbags.com.au/collections/sale'],
    },
    {
      name: 'Status Anxiety Australia',
      url: 'https://www.statusanxiety.com/',
      catalogs: ['https://www.statusanxiety.com/collections/sale'],
    },
    {
      name: 'Republic of Florence',
      url: 'https://republicofflorence.com.au/',
      catalogs: ['https://republicofflorence.com.au/collections/sale'],
    },
    {
      name: 'The Iconic Leather Bags',
      url: 'https://www.theiconic.com.au/womens-bags/',
      catalogs: ['https://www.theiconic.com.au/sale/'],
    },
    {
      name: 'Colette by Colette Hayman',
      url: 'https://www.colettebycolettehayman.com.au/',
      catalogs: ['https://www.colettebycolettehayman.com.au/collections/sale'],
    },
    {
      name: 'Cobb & Co Australia',
      url: 'https://www.cobbco.com.au/',
      catalogs: ['https://www.cobbco.com.au/collections/sale'],
    },
    {
      name: 'Louenhide Australia',
      url: 'https://www.louenhide.com.au/',
      catalogs: ['https://www.louenhide.com.au/collections/sale'],
    },
    {
      name: 'The Daily Edited',
      url: 'https://www.thedailyedited.com/',
      catalogs: ['https://www.thedailyedited.com/collections/sale'],
    },
    {
      name: 'Leather Jacket Shop Australia',
      url: 'https://www.leatherjacketshop.com.au/',
      catalogs: ['https://www.leatherjacketshop.com.au/sale'],
    },
  ];

  await Promise.all(
    leatherJacketBagStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: leatherJacketsBagsCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: leatherJacketsBagsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const petsSuppliesCategory = categories.find((category) => category.name === 'Pets Supplies');

  if (!petsSuppliesCategory) {
    throw new Error('Pets Supplies category was not created');
  }

  const petSupplyStores = [
    {
      name: 'Pet Circle Australia',
      url: 'https://www.petcircle.com.au/',
      catalogs: ['https://www.petcircle.com.au/sale/'],
    },
    {
      name: 'Petbarn Australia',
      url: 'https://www.petbarn.com.au/',
      catalogs: ['https://www.petbarn.com.au/c/flash-sale', 'https://www.petbarn.com.au/sale'],
    },
    {
      name: 'PETstock Australia',
      url: 'https://www.petstock.com.au/',
      catalogs: ['https://www.petstock.com.au/collections/sale'],
    },
    {
      name: 'Budget Pet Products',
      url: 'https://www.budgetpetproducts.com.au/',
      catalogs: ['https://www.budgetpetproducts.com.au/sale'],
    },
    {
      name: 'My Pet Warehouse',
      url: 'https://www.mypetwarehouse.com.au/',
      catalogs: ['https://www.mypetwarehouse.com.au/sale'],
    },
    {
      name: 'VetSupply Australia',
      url: 'https://www.vetsupply.com.au/',
      catalogs: ['https://www.vetsupply.com.au/specials.aspx'],
    },
    {
      name: 'Jumbo Pets Australia',
      url: 'https://www.jumbopets.com.au/',
      catalogs: ['https://www.jumbopets.com.au/sale'],
    },
    {
      name: 'Pet Culture Australia',
      url: 'https://www.petculture.com.au/',
      catalogs: ['https://www.petculture.com.au/sale'],
    },
    {
      name: 'PetO Australia',
      url: 'https://peto.com.au/',
      catalogs: ['https://peto.com.au/collections/sale'],
    },
    {
      name: 'Pet House Australia',
      url: 'https://pethouse.com.au/',
      catalogs: ['https://pethouse.com.au/collections/sale'],
    },
  ];

  await Promise.all(
    petSupplyStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: petsSuppliesCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: petsSuppliesCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const travelingAccessoriesCategory = categories.find((category) => category.name === 'Traveling Accessories');

  if (!travelingAccessoriesCategory) {
    throw new Error('Traveling Accessories category was not created');
  }

  const travelingAccessoryStores = [
    {
      name: 'Samsonite Australia',
      url: 'https://www.samsonite.com.au/',
      catalogs: ['https://www.samsonite.com.au/sale/'],
    },
    {
      name: 'July Australia',
      url: 'https://july.com/au/shop/',
      catalogs: ['https://july.com/au/shop/sale/'],
    },
    {
      name: 'Antler Australia',
      url: 'https://www.antler.com.au/',
      catalogs: ['https://www.antler.com.au/collections/sale'],
    },
    {
      name: 'American Tourister Australia',
      url: 'https://www.americantourister.com.au/',
      catalogs: ['https://www.americantourister.com.au/sale/'],
    },
    {
      name: 'Strandbags Luggage',
      url: 'https://www.strandbags.com.au/collections/luggage',
      catalogs: ['https://www.strandbags.com.au/collections/sale'],
    },
    {
      name: 'Bags To Go Australia',
      url: 'https://www.bagstogo.com.au/',
      catalogs: ['https://www.bagstogo.com.au/sale'],
    },
    {
      name: 'Crumpler Australia',
      url: 'https://www.crumpler.com/au/',
      catalogs: ['https://www.crumpler.com/au/sale'],
    },
    {
      name: 'Zoomlite Australia',
      url: 'https://www.zoomlite.com.au/',
      catalogs: ['https://www.zoomlite.com.au/collections/sale'],
    },
    {
      name: 'Kathmandu Travel Accessories',
      url: 'https://www.kathmandu.com.au/travel/travel-accessories.html',
      catalogs: ['https://www.kathmandu.com.au/sale.html'],
    },
    {
      name: 'Anaconda Travel Accessories',
      url: 'https://www.anacondastores.com/camping-hiking/travel-accessories',
      catalogs: ['https://www.anacondastores.com/sale'],
    },
  ];

  await Promise.all(
    travelingAccessoryStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: travelingAccessoriesCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: travelingAccessoriesCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const caffeBrunchCategory = categories.find((category) => category.name === 'Caffe & Brunch');

  if (!caffeBrunchCategory) {
    throw new Error('Caffe & Brunch category was not created');
  }

  const caffeBrunchStores = [
    {
      name: "Nana's Green Tea Australia",
      url: 'https://global.nanasgreentea.com/locations/',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Chubby Cubby Cafe',
      url: 'https://www.westfield.com.au/sydney/store/1Vqvifj7edIDyM89dZbArG/chubby-cubby-cafe',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Cha-no-Wa Australia',
      url: 'https://cha-no-wa.com.au/shop/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: 'Age.3 Sydney',
      url: 'https://www.age3.com.au/',
      suburb: 'Ultimo',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'T Totaler Tea',
      url: 'https://www.ttotalertea.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Mango Coco',
      url: 'https://www.agfg.com.au/restaurant/mango-coco-78518',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: "Bengong's Tea Australia",
      url: 'https://bengongstea.com.au/locations_page/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Molly Tea Australia',
      url: 'https://shop.mollytea.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Matcha-Ya Sydney',
      url: 'https://matchaya.com.au/',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'ISSHO Cafe',
      url: 'https://www.siampalettegroup.com.au/issho-cafe',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Banksia Bakehouse',
      url: 'https://www.banksia.sydney/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'ENZE Bakery',
      url: 'https://enze.com.au/pages/contact-us',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Haven Specialty Coffee',
      url: 'https://havenspecialtycoffee.com.au/',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Four Ate Five',
      url: 'https://www.fouratefive.com/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Lode Pies & Pastries',
      url: 'https://www.lodepies.com/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Oh! Matcha',
      url: 'https://www.ohmatcha.com.au/about-oh-matcha',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Homm Dessert',
      url: 'https://hommdesserts.com.au/',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Bills Australia',
      url: 'https://www.bills.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Little Piggy Cafe',
      url: 'https://www.littlepiggycafe.com/',
      suburb: 'Ripley',
      city: 'Ipswich',
      catalogs: [],
    },
    {
      name: "Cherry's Goods",
      url: 'https://www.broadsheet.com.au/sydney/food-and-drink/article/cherrys-goods-galeries-reopens',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'HEYTEA Australia',
      url: 'https://heyteas.com/australia/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Arctic White',
      url: 'https://www.westfield.com.au/sydney/store/WvXXpvxVnigV1rB5HDQwp/arctic-white',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Chatime Australia',
      url: 'https://chatime.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://chatime.com.au/offer-tcs/',
        'https://chatime.com.au/faqs/',
      ],
    },
    {
      name: 'Gong Cha Australia',
      url: 'https://gongcha.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'ChaHalo Australia',
      url: 'https://www.chahalo.com.au/locations',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Edison Roasters',
      url: 'https://www.hummroasters.com.au/',
      suburb: 'North Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'The Grounds',
      url: 'https://thegrounds.com.au/takeaway/',
      suburb: 'Alexandria',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'KUKI Sydney',
      url: 'https://www.kuki.au/menu',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Outta Coffee',
      url: 'https://latamcoffeetrip.com/cafes/outta-coffee',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Dulcet Cakes & Sweets',
      url: 'https://dulcet.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Jibbi & Co',
      url: 'https://www.jibbiandco.com.au/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Mogu Mogu Sydney',
      url: 'https://www.mogumogu.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Brewtopia',
      url: 'https://www.brewcafe.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Tokyo Lamington',
      url: 'https://www.tokyolamington.com/',
      suburb: 'Newtown',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Chinatown Country Club Cafe',
      url: 'https://chinatowncountryclub.com/pages/contact-us',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Butterboy',
      url: 'https://www.butterboy.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Ruben Hills',
      url: 'https://sydneycoffeeshops.com/coffee-shops/surry-hills/reuben-hills.html',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'AP Bakery',
      url: 'https://www.apbakery.com.au/about',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Paramount Coffee Project',
      url: 'https://www.paramountcoffeeproject.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Single O Surry Hills',
      url: 'https://singleo.com.au/pages/surry-hills',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Edition Roasters',
      url: 'https://editionroasters.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Proud Mary Cafe Melbourne',
      url: 'https://www.proudmarycoffee.com.au/pages/proud-mary-cafe',
      suburb: 'Collingwood',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Seven Seeds Carlton',
      url: 'https://sevenseeds.com.au/',
      suburb: 'Carlton',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Higher Ground Melbourne',
      url: 'https://highergroundmelbourne.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'ST. ALi South Melbourne',
      url: 'https://stali.com.au/pages/south-melbourne',
      suburb: 'South Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Industry Beans Fitzroy',
      url: 'https://industrybeans.com/pages/fitzroy',
      suburb: 'Fitzroy',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Market Lane Coffee',
      url: 'https://marketlane.com.au/pages/locations',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Ten Square Cafe',
      url: 'https://www.tensquarecafe.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
  ];

  await Promise.all(
    caffeBrunchStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: caffeBrunchCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: caffeBrunchCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const diningBeveragesCategory = categories.find((category) => category.name === 'Dining & Beverages');

  if (!diningBeveragesCategory) {
    throw new Error('Dining & Beverages category was not created');
  }

  const diningBeverageStores = [
    {
      name: 'Sky Bar at Shell House',
      url: 'https://shellhouse.com.au/sky-bar/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://shellhouse.com.au/whats-on/'],
    },
    {
      name: 'The Glenmore Hotel',
      url: 'https://www.theglenmore.com.au/',
      suburb: 'The Rocks',
      city: 'Sydney',
      catalogs: ['https://www.theglenmore.com.au/whats-on/'],
    },
    {
      name: 'The Dolphin Hotel',
      url: 'https://dolphinhotel.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://dolphinhotel.com.au/whats-on/'],
    },
    {
      name: 'Opera Bar',
      url: 'https://www.operabar.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.operabar.com.au/whats-on',
        'https://www.operabar.com.au/sydney-all-nighter',
      ],
    },
    {
      name: "The Squire's Landing",
      url: 'https://thesquireslanding.com.au/',
      suburb: 'The Rocks',
      city: 'Sydney',
      catalogs: ['https://thesquireslanding.com.au/whats-on/'],
    },
    {
      name: 'Sydney Brewery Surry Hills',
      url: 'https://sydneybrewery.com/surry-hills/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://sydneybrewery.com/surry-hills/'],
    },
    {
      name: "Forrester's Surry Hills",
      url: 'https://forresters.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://forresters.com.au/whats-on/'],
    },
    {
      name: 'Brix Distillers',
      url: 'https://www.brixdistillers.com/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://www.brixdistillers.com/surry-hills-happy-hour'],
    },
    {
      name: 'The White Horse',
      url: 'https://thewhitehorse.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://thewhitehorse.com.au/whats-on/'],
    },
    {
      name: "Molly Malone's Irish Tavern",
      url: 'https://mollymalonestavern.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://mollymalonestavern.com.au/whats-on/'],
    },
    {
      name: 'Jane Surry Hills',
      url: 'https://www.janesurryhills.com/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Maybe Sammy',
      url: 'https://www.maybesammy.com/home',
      suburb: 'The Rocks',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'The Rook',
      url: 'https://therook.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://therook.com.au/whats-on/'],
    },
    {
      name: 'Untied Barangaroo',
      url: 'https://untiedsydney.com.au/',
      suburb: 'Barangaroo',
      city: 'Sydney',
      catalogs: ['https://www.barangaroo.com/eat-drink/untied'],
    },
    {
      name: 'The Carrington',
      url: 'https://thecarringtonsydney.com/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://thecarringtonsydney.com/whats-on/'],
    },
    {
      name: "Surly's",
      url: 'https://www.surlys.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://www.surlys.com.au/whats-on/'],
    },
    {
      name: 'Aster Bar',
      url: 'https://asterbar.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://asterbar.com.au/whats-on/'],
    },
    {
      name: 'Zephyr Bar',
      url: 'https://zephyrbarsydney.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://zephyrbarsydney.com/whats-on/'],
    },
    {
      name: 'Bennelong',
      url: 'https://www.bennelong.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Attica Melbourne',
      url: 'https://www.attica.com.au/',
      suburb: 'Ripponlea',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Flower Drum Melbourne',
      url: 'https://flowerdrum.melbourne/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Gimlet Melbourne',
      url: 'https://gimlet.melbourne/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Toko Sydney',
      url: 'https://tokorestaurant.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Haco Sydney',
      url: 'https://hacosydney.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Saké Restaurant & Bar',
      url: 'https://sakerestaurant.com.au/',
      suburb: 'The Rocks',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Nobu Sydney',
      url: 'https://www.crownhotels.com.au/sydney/restaurants-bars/nobu',
      suburb: 'Barangaroo',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Oborozuki',
      url: 'https://www.oborozuki.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Shoya Melbourne',
      url: 'https://shoya.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Warabi Melbourne',
      url: 'https://www.warabimelbourne.com/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Doju Melbourne',
      url: 'https://www.doju.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'RuYi Modern Chinese',
      url: 'https://www.ruyi.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Akaiito Melbourne',
      url: 'https://akaiitorestaurant.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'GogiMatcha',
      url: 'https://www.gogimatcha.com/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Han Le Miel',
      url: 'https://www.hanlemiel.com/',
      suburb: 'Carlton',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Allta Sydney',
      url: 'https://alltasydney.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Funda Sydney',
      url: 'https://funda.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'SOUL Dining',
      url: 'https://www.souldining.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Kuro Bar & Dining',
      url: 'https://kurosydney.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://kurosydney.com/whats-on/'],
    },
    {
      name: 'Besuto Omakase',
      url: 'https://besutosydney.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Sokyo Sydney',
      url: 'https://www.star.com.au/sydney/eat-and-drink/signature-dining/sokyo',
      suburb: 'Pyrmont',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Saint Peter',
      url: 'https://www.saintpeter.com.au/',
      suburb: 'Paddington',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Sixpenny',
      url: 'https://sixpenny.com.au/',
      suburb: 'Stanmore',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Firedoor',
      url: 'https://firedoor.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Restaurant Hubert',
      url: 'https://swillhouse.com/venues/restaurant-hubert',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
  ];

  await Promise.all(
    diningBeverageStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: diningBeveragesCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: diningBeveragesCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const musicGearsCategory = categories.find((category) => category.name === 'Music Gears');

  if (!musicGearsCategory) {
    throw new Error('Music Gears category was not created');
  }

  const additionalMusicGearStores = [
    {
      name: 'Artist Guitars Australia',
      url: 'https://www.artistguitars.com.au/',
      catalogs: [
        'https://www.artistguitars.com.au/collections/sale',
        'https://www.artistguitars.com.au/collections/clearance',
      ],
    },
    {
      name: 'Sky Music Australia',
      url: 'https://skymusic.com.au/',
      catalogs: ['https://skymusic.com.au/collections/sale'],
    },
    {
      name: 'Better Music',
      url: 'https://www.bettermusic.com.au/',
      catalogs: ['https://www.bettermusic.com.au/sale'],
    },
    {
      name: 'Derringers Music',
      url: 'https://derringers.com.au/',
      catalogs: ['https://derringers.com.au/sale'],
    },
    {
      name: 'Store DJ',
      url: 'https://www.storedj.com.au/',
      catalogs: ['https://www.storedj.com.au/sale'],
    },
    {
      name: 'DJ City Australia',
      url: 'https://djcity.com.au/',
      catalogs: ['https://djcity.com.au/sale'],
    },
    {
      name: 'Kosmic Sound',
      url: 'https://www.kosmic.com.au/',
      catalogs: ['https://www.kosmic.com.au/sale'],
    },
    {
      name: 'Sound Centre',
      url: 'https://www.soundcentre.com.au/',
      catalogs: ['https://www.soundcentre.com.au/collections/sale'],
    },
    {
      name: 'Mega Music',
      url: 'https://www.megamusiconline.com.au/',
      catalogs: ['https://www.megamusiconline.com.au/sale'],
    },
    {
      name: 'Bass Centre',
      url: 'https://www.basscentre.com.au/',
      catalogs: ['https://www.basscentre.com.au/collections/sale'],
    },
    {
      name: 'Music Junction',
      url: 'https://www.musicjunction.com.au/',
      catalogs: ['https://www.musicjunction.com.au/sale'],
    },
    {
      name: 'World of Music',
      url: 'https://www.worldofmusic.com.au/',
      catalogs: ['https://www.worldofmusic.com.au/sale'],
    },
  ];

  await Promise.all(
    additionalMusicGearStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: musicGearsCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: musicGearsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const financialServicesCategory = categories.find((category) => category.name === 'Financial & Services');

  if (!financialServicesCategory) {
    throw new Error('Financial & Services category was not created');
  }

  const financialServiceStores = [
    {
      name: 'Marketpal.AI',
      url: 'https://marketpal.ai',
      catalogs: ['https://marketpal.ai/pricing'],
    },
    {
      name: 'Finder Australia',
      url: 'https://www.finder.com.au/',
      catalogs: [
        'https://www.finder.com.au/deals',
        'https://www.finder.com.au/coupon-codes',
      ],
    },
    {
      name: 'Canstar Australia',
      url: 'https://www.canstar.com.au/',
      catalogs: ['https://www.canstar.com.au/savings-accounts/bonus-savings-accounts/'],
    },
    {
      name: 'Mozo Australia',
      url: 'https://mozo.com.au/',
      catalogs: ['https://mozo.com.au/special-offers'],
    },
    {
      name: 'Compare the Market Australia',
      url: 'https://www.comparethemarket.com.au/',
      catalogs: ['https://www.comparethemarket.com.au/special-offers/'],
    },
    {
      name: 'iSelect Australia',
      url: 'https://www.iselect.com.au/',
      catalogs: ['https://www.iselect.com.au/offers/'],
    },
    {
      name: 'RateCity Australia',
      url: 'https://www.ratecity.com.au/',
      catalogs: ['https://www.ratecity.com.au/savings-accounts/bonus-savings-accounts'],
    },
    {
      name: 'InfoChoice Australia',
      url: 'https://www.infochoice.com.au/',
      catalogs: ['https://www.infochoice.com.au/savings-accounts/bonus-saver'],
    },
    {
      name: 'Savvy Australia',
      url: 'https://www.savvy.com.au/',
      catalogs: ['https://www.savvy.com.au/personal-loans/'],
    },
    {
      name: 'MoneyMe',
      url: 'https://moneyme.com.au/',
      catalogs: ['https://moneyme.com.au/personal-loans/'],
    },
  ];

  await Promise.all(
    financialServiceStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: financialServicesCategory.id,
        },
        create: {
          name: store.name,
          suburb: 'Sydney',
          city: 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: financialServicesCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  // Create some test discounts
  await Promise.all([
    prisma.discount.upsert({
      where: {
        storeId_title: {
          storeId: stores[1].id,
          title: '20% off all coffee',
        },
      },
      update: {},
      create: {
        storeId: stores[1].id,
        title: '20% off all coffee',
        description: 'Get 20% off all coffee drinks this week',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    }),
    prisma.discount.upsert({
      where: {
        storeId_title: {
          storeId: stores[3].id,
          title: '40% off Electronics',
        },
      },
      update: {},
      create: {
        storeId: stores[3].id,
        title: '40% off Electronics',
        description: 'Huge discount on all electronics',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    }),
    prisma.discount.upsert({
        where: {
          storeId_title: {
            storeId: stores[0].id,
            title: 'Free One Month Membership',
          },
        },
        update: {},
        create: {
          storeId: stores[0].id,
          title: 'Free One Month Membership',
          description: 'Get free one month membership for new members',
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
      }),
      prisma.discount.upsert({
        where: {
          storeId_title: {
            storeId: stores[2].id,
            title: 'Special 10% off all food',
          },
        },
        update: {},
        create: {
          storeId: stores[2].id,
          title: 'Special 10% off all food',
          description: 'Get 10% off all food this week',
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
      }),
      prisma.discount.upsert({
        where: {
          storeId_title: {
            storeId: stores[2].id,
            title: 'Happy Hour 30% off drinks',
          },
        },
        update: {},
        create: {
          storeId: stores[2].id,
          title: 'Happy Hour 30% off drinks',
          description: 'Get 30% off all drinks this week',
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
      }),
  ]);

  console.log('Database seeded successfully!');
  console.log('Test user created: test@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
