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
        where: { name: 'Factory Outlets' },
        update: {},
        create: { name: 'Factory Outlets' },
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
      prisma.category.upsert({
        where: { name: 'Hobbies & Classes' },
        update: {},
        create: { name: 'Hobbies & Classes' },
      }),
      prisma.category.upsert({
        where: { name: 'Cultural Bites & Takeaway' },
        update: {},
        create: { name: 'Cultural Bites & Takeaway' },
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
    {
      name: 'Ruby Lane Wholefoods Manly',
      url: 'https://www.rubylane.com.au/',
      suburb: 'Manly',
      city: 'Sydney',
      catalogs: ['https://www.rubylane.com.au/'],
    },
    {
      name: 'Earlwood Growers Market',
      url: 'https://www.egm.com.au/site/index.php',
      suburb: 'Earlwood',
      city: 'Sydney',
      catalogs: ['https://www.egm.com.au/site/index.php'],
    },
    {
      name: 'Hudson Meats Sydney',
      url: 'https://hudsonmeats.com/',
      suburb: 'Cammeray',
      city: 'Sydney',
      catalogs: ['https://hudsonmeats.com/collections/specials'],
    },
    {
      name: 'Chop Butchery Sydney',
      url: 'https://chopbutchery.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://chopbutchery.com.au/collections/specials'],
    },
    {
      name: 'Great Meats Co Sydney',
      url: 'https://greatmeatsco.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://greatmeatsco.com.au/collections/specials'],
    },
    {
      name: 'Maxie Ozie Butchery Fairfield',
      url: 'https://maxie-ozie.com/',
      suburb: 'Fairfield',
      city: 'Sydney',
      catalogs: ['https://maxie-ozie.com/'],
    },
    {
      name: 'No.9 Butcher Cabramatta',
      url: 'https://cabramattaplaza.com.au/directory/no-9-butcher/',
      suburb: 'Cabramatta',
      city: 'Sydney',
      catalogs: ['https://cabramattaplaza.com.au/directory/no-9-butcher/'],
    },
    {
      name: 'The Premium Meat Market Cabramatta',
      url: 'https://www.duttonplaza.com.au/Find-a-Store/The-Premium-Meat-Market',
      suburb: 'Cabramatta',
      city: 'Sydney',
      catalogs: ['https://www.duttonplaza.com.au/Find-a-Store/The-Premium-Meat-Market'],
    },
    {
      name: 'Feather and Bone Marrickville',
      url: 'https://featherandbone.com.au/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: [
        'https://featherandbone.com.au/',
        'https://featherandbone.com.au/pages/contact',
      ],
    },
    {
      name: 'Black Forest Smokehouse Marrickville',
      url: 'https://blackforestsmokehouse.com.au/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: [
        'https://blackforestsmokehouse.com.au/',
        'https://blackforestsmokehouse.com.au/collections/family-packs',
      ],
    },
    {
      name: "LP's Quality Meats Marrickville",
      url: 'https://lpsqualitymeats.com/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://lpsqualitymeats.com/'],
    },
    {
      name: "Lucky Marrickville's Best Meats",
      url: 'https://marrickvillebestme.wixsite.com/website',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://marrickvillebestme.wixsite.com/website'],
    },
    {
      name: 'Metro Master Meats Marrickville',
      url: 'https://www.marrickvillemetro.com.au/stores-services/metro-master-meats',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://www.marrickvillemetro.com.au/stores-services/metro-master-meats'],
    },
    {
      name: 'Hereford Prime Campsie',
      url: 'https://herefordprime.com.au/butcher-shops',
      suburb: 'Campsie',
      city: 'Sydney',
      catalogs: [
        'https://herefordprime.com.au/butcher-shops',
        'https://herefordprime.com.au/this-weeks-specials',
      ],
    },
    {
      name: 'The Imperial Meat Co Chatswood',
      url: 'https://www.westfield.com.au/chatswood/store/2x0teWB43dwkBUvueGNtXO/the-imperial-meat-co',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: ['https://www.westfield.com.au/chatswood/store/2x0teWB43dwkBUvueGNtXO/the-imperial-meat-co'],
    },
    {
      name: "Uncles' Butchery Eastwood",
      url: 'https://unclesbutchery.com/',
      suburb: 'Eastwood',
      city: 'Sydney',
      catalogs: ['https://unclesbutchery.com/'],
    },
    {
      name: "Hahn's Korean Butchers Eastwood",
      url: 'https://www.hahnsbbq.com.au/home',
      suburb: 'Eastwood',
      city: 'Sydney',
      catalogs: ['https://www.hahnsbbq.com.au/home'],
    },
    {
      name: 'Lloyds IGA South Hurstville',
      url: 'https://www.iga.com.au/stores/lloyds-iga-south-hurstville/',
      suburb: 'South Hurstville',
      city: 'Sydney',
      catalogs: [
        'https://www.iga.com.au/stores/lloyds-iga-south-hurstville/',
        'https://www.iga.com.au/catalogue/',
      ],
    },
    {
      name: 'WE Meat Hurstville',
      url: 'https://wemeat.com.au/',
      suburb: 'Hurstville',
      city: 'Sydney',
      catalogs: ['https://wemeat.com.au/'],
    },
    {
      name: "Jack's Meats Canterbury",
      url: 'https://meat2urdoor.com.au/',
      suburb: 'Canterbury',
      city: 'Sydney',
      catalogs: [
        'https://meat2urdoor.com.au/',
        'https://meat2urdoor.com.au/specials',
      ],
    },
    {
      name: 'Lazy River Meats Parramatta',
      url: 'https://www.lazyrivermeats.com.au/',
      suburb: 'Parramatta',
      city: 'Sydney',
      catalogs: ['https://www.lazyrivermeats.com.au/'],
    },
    {
      name: 'Supreme Souvlakia Belmore',
      url: 'https://www.supremesouvlakia.au/',
      suburb: 'Belmore',
      city: 'Sydney',
      catalogs: ['https://www.supremesouvlakia.au/'],
    },
    {
      name: 'Strathfield Meat Mart',
      url: 'https://strathfieldmeatmart.wixsite.com/stramm',
      suburb: 'Strathfield',
      city: 'Sydney',
      catalogs: ['https://strathfieldmeatmart.wixsite.com/stramm'],
    },
    {
      name: 'Meabang Butchery Meadowbank',
      url: 'https://www.villageplaza.com.au/stores/meabang-butchery',
      suburb: 'Meadowbank',
      city: 'Sydney',
      catalogs: ['https://www.villageplaza.com.au/stores/meabang-butchery'],
    },
    {
      name: 'Pryde Butchery Miranda',
      url: 'https://prydebutchery.com.au/',
      suburb: 'Miranda',
      city: 'Sydney',
      catalogs: [
        'https://prydebutchery.com.au/',
        'https://prydebutchery.com.au/specials/',
      ],
    },
    {
      name: 'The Leaf Store Melbourne',
      url: 'https://theleafstore.com.au/',
      suburb: 'Elwood',
      city: 'Melbourne',
      catalogs: ['https://theleafstore.com.au/shop-online/'],
    },
    {
      name: 'Fitzroy Wholefoods',
      url: 'https://www.fitzroywholefoods.com.au/',
      suburb: 'Fitzroy',
      city: 'Melbourne',
      catalogs: ['https://www.fitzroywholefoods.com.au/'],
    },
    {
      name: 'CERES Fair Food',
      url: 'https://www.ceresfairfood.org.au/',
      suburb: 'Brunswick East',
      city: 'Melbourne',
      catalogs: ['https://www.ceresfairfood.org.au/shop/specials/'],
    },
    {
      name: 'The Butcher Club Melbourne',
      url: 'https://www.thebutcherclub.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.thebutcherclub.com.au/'],
    },
    {
      name: 'Mauro Bros Butchers Melbourne',
      url: 'https://maurobros.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://maurobros.com.au/collections/specials'],
    },
    {
      name: 'Australian Butchers Store',
      url: 'https://butchersstore.com.au/',
      suburb: 'Dandenong',
      city: 'Melbourne',
      catalogs: ['https://butchersstore.com.au/collections/specials'],
    },
    {
      name: 'Good Things Grocer Tarragindi',
      url: 'https://goodthingsgrocer.com.au/',
      suburb: 'Tarragindi',
      city: 'Brisbane',
      catalogs: ['https://goodthingsgrocer.com.au/'],
    },
    {
      name: 'TMP Organics Brisbane',
      url: 'https://www.tmporganics.com.au/',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: ['https://www.tmporganics.com.au/collections/specials'],
    },
    {
      name: 'Mallans Bulk Meats Fairfield',
      url: 'https://www.mallans.com.au/',
      suburb: 'Fairfield',
      city: 'Brisbane',
      catalogs: ['https://www.mallans.com.au/'],
    },
    {
      name: "Meat at Billy's Brisbane",
      url: 'https://meatatbillys.com.au/online-butcher-brisbane/',
      suburb: 'Ashgrove',
      city: 'Brisbane',
      catalogs: ['https://meatatbillys.com.au/online-butcher-brisbane/'],
    },
    {
      name: 'Farmer Jacks Perth',
      url: 'https://www.farmerjacks.com.au/',
      suburb: 'Perth',
      city: 'Perth',
      catalogs: ['https://www.farmerjacks.com.au/catalogue/'],
    },
    {
      name: 'The Herdsman Market Perth',
      url: 'https://theherdsman.com.au/',
      suburb: 'Churchlands',
      city: 'Perth',
      catalogs: ['https://theherdsman.com.au/'],
    },
    {
      name: 'Mondo Butcher & Grocer Perth',
      url: 'https://mondo.net.au/',
      suburb: 'Inglewood',
      city: 'Perth',
      catalogs: ['https://mondo.net.au/shop/'],
    },
    {
      name: 'Austral Meat Market Adelaide',
      url: 'https://www.australmeat.com.au/',
      suburb: 'Gepps Cross',
      city: 'Adelaide',
      catalogs: ['https://www.australmeat.com.au/specials/'],
    },
    {
      name: 'Foods For Life Adelaide',
      url: 'https://foodsforlife.com.au/',
      suburb: 'Adelaide CBD',
      city: 'Adelaide',
      catalogs: ['https://foodsforlife.com.au/specials/'],
    },
    {
      name: "Tony & Mark's Adelaide",
      url: 'https://tonyandmarks.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: ['https://tonyandmarks.com.au/'],
    },
    {
      name: 'Go Vita Australia',
      url: 'https://govita.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://govita.com.au/'],
    },
    {
      name: 'The Source Bulk Foods Australia',
      url: 'https://thesourcebulkfoods.com.au/',
      suburb: 'Balaclava',
      city: 'Melbourne',
      catalogs: [
        'https://thesourcebulkfoods.com.au/everyday-savings/',
        'https://shop.thesourcebulkfoods.com.au/',
      ],
    },
    {
      name: 'BWS Australia',
      url: 'https://bws.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://bws.com.au/discover/special-deals'],
    },
    {
      name: "Dan Murphy's Australia",
      url: 'https://www.danmurphys.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.danmurphys.com.au/current-offers'],
    },
    {
      name: 'Liquorland Australia',
      url: 'https://www.liquorland.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.liquorland.com.au/catalogue'],
    },
    {
      name: 'First Choice Liquor Market',
      url: 'https://www.firstchoiceliquor.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.firstchoiceliquor.com.au/catalogue'],
    },
    {
      name: 'Vintage Cellars Australia',
      url: 'https://www.vintagecellars.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.vintagecellars.com.au/catalogue'],
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
      name: 'Akubra Hats Australia',
      url: 'https://akubra.com.au/',
      suburb: 'Kempsey',
      city: 'Kempsey',
      catalogs: ['https://akubra.com.au/collections/sale'],
    },
    {
      name: 'Brixton Australia Headwear',
      url: 'https://au.brixton.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://au.brixton.com/collections/sale-headwear'],
    },
    {
      name: 'New Era Cap Australia',
      url: 'https://www.neweracap.com.au/collections/headwear',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.neweracap.com.au/collections/sale',
        'https://www.neweracap.com.au/collections/sale-headwear',
      ],
    },
    {
      name: 'Hats by the Hundred Southport',
      url: 'https://www.hatsbythe100.com.au/',
      suburb: 'Southport',
      city: 'Gold Coast',
      catalogs: [
        'https://www.hatsbythe100.com.au/collections/clearance-corner',
        'https://www.hatsbythe100.com.au/collections/mens-and-womens-caps',
      ],
    },
    {
      name: 'The Hat Store Gold Coast',
      url: 'https://thehatstore.com.au/',
      suburb: 'Gold Coast',
      city: 'Gold Coast',
      catalogs: [
        'https://thehatstore.com.au/',
        'https://thehatstore.com.au/collections/caps-snapbacks',
      ],
    },
    {
      name: 'Cap-Z Australia',
      url: 'https://www.cap-z.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [
        'https://www.cap-z.com.au/',
        'https://www.cap-z.com.au/collections/new-era',
      ],
    },
    {
      name: 'Culture Kings Sale Headwear',
      url: 'https://www.culturekings.com.au/collections/mens-sale-headwear',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: [
        'https://www.culturekings.com.au/collections/mens-sale-headwear',
        'https://www.culturekings.com.au/collections/new-era-sale',
      ],
    },
    {
      name: 'Strand Hatters Sydney',
      url: 'https://strandhatters.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://strandhatters.com.au/collections/sale'],
    },
    {
      name: 'City Hatters Melbourne',
      url: 'https://cityhatters.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [
        'https://cityhatters.com.au/collections/city-hatters',
        'https://cityhatters.com.au/collections/sale',
      ],
    },
    {
      name: 'Grand Hatters Melbourne',
      url: 'https://www.grandhatters.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.grandhatters.com.au/'],
    },
    {
      name: 'Oz Australia Fremantle',
      url: 'https://ozaustralia.com/',
      suburb: 'Fremantle',
      city: 'Perth',
      catalogs: [
        'https://ozaustralia.com/collections/akubra-hats',
        'https://ozaustralia.com/collections/vendors?q=AKUBRA',
      ],
    },
    {
      name: 'Deus Ex Machina Sale Hats',
      url: 'https://deuscustoms.com.au/collections/sale-hats',
      suburb: 'Camperdown',
      city: 'Sydney',
      catalogs: ['https://deuscustoms.com.au/collections/sale-hats'],
    },
    {
      name: 'Hemley Store Fitzroy Headwear',
      url: 'https://hemley.com.au/accessories/headwear-mens/',
      suburb: 'Fitzroy',
      city: 'Melbourne',
      catalogs: [
        'https://hemley.com.au/accessories/headwear-mens/',
        'https://hemley.com.au/accessories/caps/trucker-caps/',
      ],
    },
    {
      name: 'Roxy Australia Sale Hats',
      url: 'https://www.roxyaustralia.com.au/collections/sale-womens-hats',
      suburb: 'Torquay',
      city: 'Geelong',
      catalogs: ['https://www.roxyaustralia.com.au/collections/sale-womens-hats'],
    },
    {
      name: "Assef's Hats",
      url: 'https://assefs.com.au/collections/hats',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://assefs.com.au/collections/hats'],
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
      suburb: 'Sydney',
      city: 'Sydney',
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
      suburb: 'Bankstown',
      city: 'Sydney',
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
      suburb: 'Bankstown',
      city: 'Sydney',
      catalogs: [
        'https://www.thegoodguys.com.au/deals',
        'https://www.thegoodguys.com.au/sale',
      ],
    },
    {
      name: 'Harvey Norman',
      url: 'https://www.harveynorman.com.au/',
      suburb: 'Auburn',
      city: 'Sydney',
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
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.officeworks.com.au/shop/officeworks/c/sale'],
    },
    {
      name: 'Kogan Australia',
      url: 'https://www.kogan.com/au/',
      suburb: 'South Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.kogan.com/au/deals/'],
    },
    {
      name: 'Appliances Online',
      url: 'https://www.appliancesonline.com.au/',
      suburb: 'Alexandria',
      city: 'Sydney',
      catalogs: ['https://www.appliancesonline.com.au/sale/'],
    },
    {
      name: 'Retravision',
      url: 'https://www.retravision.com.au/',
      suburb: 'Perth',
      city: 'Perth',
      catalogs: ['https://www.retravision.com.au/promotions'],
    },
    {
      name: 'Scorptec',
      url: 'https://www.scorptec.com.au/',
      suburb: 'Silverwater',
      city: 'Sydney',
      catalogs: ['https://www.scorptec.com.au/specials'],
    },
    {
      name: 'Mwave Australia',
      url: 'https://www.mwave.com.au/',
      suburb: 'Lidcombe',
      city: 'Sydney',
      catalogs: ['https://www.mwave.com.au/hot-deals'],
    },
    {
      name: 'Umart Australia',
      url: 'https://www.umart.com.au/',
      suburb: 'Mansfield',
      city: 'Brisbane',
      catalogs: [
        'https://www.umart.com.au/hot-deals',
        'https://www.umart.com.au/blogs/news/umart-star-night-sale-big-savings-across-all-categories-3026a',
      ],
    },
    {
      name: 'Centre Com Sunshine',
      url: 'https://www.centrecom.com.au/',
      suburb: 'Sunshine',
      city: 'Melbourne',
      catalogs: [
        'https://www.centrecom.com.au/',
        'https://www.centrecom.com.au/catalog/specials',
      ],
    },
    {
      name: 'PLE Computers Bentley',
      url: 'https://www.ple.com.au/',
      suburb: 'Bentley',
      city: 'Perth',
      catalogs: [
        'https://www.ple.com.au/CategoryGroups/10/Specials',
        'https://www.ple.com.au/promotion/NHw7',
      ],
    },
    {
      name: 'Computer Alliance Brisbane',
      url: 'https://www.computeralliance.com.au/',
      suburb: 'Mount Gravatt',
      city: 'Brisbane',
      catalogs: [
        'https://www.computeralliance.com.au/clearance/',
        'https://www.computeralliance.com.au/promos?id=5288',
      ],
    },
    {
      name: 'JW Computers Bankstown',
      url: 'https://www.jw.com.au/',
      suburb: 'Bankstown',
      city: 'Sydney',
      catalogs: [
        'https://www.jw.com.au/',
        'https://www.jw.com.au/cyber-week',
        'https://www.jw.com.au/black-friday-sale',
      ],
    },
    {
      name: 'Mobileciti Lidcombe',
      url: 'https://www.mobileciti.com.au/',
      suburb: 'Lidcombe',
      city: 'Sydney',
      catalogs: [
        'https://www.mobileciti.com.au/',
        'https://www.mobileciti.com.au/collections/mobile-phones',
      ],
    },
    {
      name: 'MegaBuy Brisbane',
      url: 'https://www.megabuy.com.au/',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: [
        'https://www.megabuy.com.au/',
        'https://www.megabuy.com.au/index.php',
      ],
    },
    {
      name: 'Allneeds Computers Adelaide',
      url: 'https://allneeds.com.au/',
      suburb: 'Adelaide CBD',
      city: 'Adelaide',
      catalogs: [
        'https://allneeds.com.au/',
        'https://allneeds.com.au/computer-parts-and-accessories.html',
      ],
    },
    {
      name: 'Melbourne Computers Clayton',
      url: 'https://melbournecomputers.com.au/',
      suburb: 'Clayton',
      city: 'Melbourne',
      catalogs: ['https://melbournecomputers.com.au/shop/'],
    },
    {
      name: 'Infinity PCs Camperdown',
      url: 'https://www.infinitypcs.com/',
      suburb: 'Camperdown',
      city: 'Sydney',
      catalogs: ['https://www.infinitypcs.com/'],
    },
    {
      name: 'Dshop Electronics & Gadgets',
      url: 'https://dshop.com.au/collections/electronics-gadgets',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [
        'https://dshop.com.au/collections/sale',
        'https://dshop.com.au/collections/clearance',
      ],
    },
    {
      name: 'Dick Smith Australia',
      url: 'https://www.dicksmith.com.au/da/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.dicksmith.com.au/da/c/hot-deals/'],
    },
    {
      name: 'Samsung Australia',
      url: 'https://www.samsung.com/au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.samsung.com/au/offer/deals/',
        'https://www.samsung.com/au/offer/',
      ],
    },
    {
      name: 'Xiaomi Australia',
      url: 'https://www.mi.com/au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.mi.com/au/event/offer-exclusive-deals/',
        'https://www.mi.com/au/store/',
      ],
    },
    {
      name: 'DJI Store Australia',
      url: 'https://store.dji.com/au?set_region=AU',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://store.dji.com/au?set_region=AU',
        'https://www.dji.com/au',
      ],
    },
    {
      name: 'Motorola Australia',
      url: 'https://www.motorola.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.motorola.com.au/',
        'https://www.motorola.com/au/en/',
      ],
    },
    {
      name: 'NAPF Electronics Auburn',
      url: 'https://www.napf.com.au/',
      suburb: 'Auburn',
      city: 'Sydney',
      catalogs: ['https://www.napf.com.au/'],
    },
    {
      name: 'The Hub by Triforce Bella Vista',
      url: 'https://hub.triforce.com.au/',
      suburb: 'Bella Vista',
      city: 'Sydney',
      catalogs: [
        'https://hub.triforce.com.au/',
        'https://hub.triforce.com.au/faqs/',
      ],
    },
    {
      name: 'Computer Depot Unley',
      url: 'https://computerdepot.com.au/',
      suburb: 'Unley',
      city: 'Adelaide',
      catalogs: [
        'https://computerdepot.com.au/',
        'https://computerdepot.com.au/service-repairs/',
      ],
    },
    {
      name: 'Fone King Repairs',
      url: 'https://foneking.com.au/pages/repairs',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://foneking.com.au/collections/repairs'],
    },
    {
      name: 'PTC Phone Tech & Comm',
      url: 'https://www.ptc.net.au/',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: [
        'https://www.ptc.net.au/',
        'https://www.ptcshop.com.au/',
        'https://www.ptcshop.com.au/collections',
      ],
    },
  ];

  await Promise.all(
    electronicGadgetStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: electronicGadgetsCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
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
      name: 'Montblanc Australia',
      url: 'https://www.montblanc.com/en-au/home',
      catalogs: ['https://www.montblanc.com/en-au/gifts'],
    },
    {
      name: 'Balenciaga Australia',
      url: 'https://www.balenciaga.com/en-au',
      catalogs: [],
    },
    {
      name: 'Burberry Australia',
      url: 'https://au.burberry.com/',
      catalogs: [
        'https://au.burberry.com/l/sale/',
        'https://au.burberry.com/c/sale/',
      ],
    },
    {
      name: 'Versace Australia',
      url: 'https://www.versace.com/au/en/',
      catalogs: [
        'https://www.versace.com/au/en/sale/',
        'https://www.versace.com/au/en/sale/womens-sale/',
      ],
    },
    {
      name: 'Valentino Australia',
      url: 'https://www.valentino.com/en-au/',
      catalogs: [
        'https://www.valentino.com/en-au/women/woman-sale',
        'https://www.valentino.com/en-au/men/man-sale',
      ],
    },
    {
      name: 'Bottega Veneta Australia',
      url: 'https://www.bottegaveneta.com/en-au',
      catalogs: [],
    },
    {
      name: 'Alexander McQueen Australia',
      url: 'https://www.alexandermcqueen.com/au',
      catalogs: [],
    },
    {
      name: 'Fendi Australia',
      url: 'https://www.fendi.com/au-en/',
      catalogs: [],
    },
    {
      name: 'CELINE Australia',
      url: 'https://www.celine.com/en-au/',
      catalogs: [],
    },
    {
      name: 'DIOR Australia',
      url: 'https://www.dior.com/en_au',
      catalogs: [],
    },
    {
      name: 'Louis Vuitton Australia',
      url: 'https://au.louisvuitton.com/eng-au/homepage',
      catalogs: [],
    },
    {
      name: 'Ferragamo Australia',
      url: 'https://www.ferragamo.com/shop/aus/en',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [
        'https://www.ferragamo.com/shop/aus/en/women/womens-sales',
        'https://www.ferragamo.com/shop/aus/en/sale/mens-sales/shoes-men-sales',
      ],
    },
    {
      name: 'Jimmy Choo Australia',
      url: 'https://www.jimmychoo.com/au/en_AU/home',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://www.jimmychoo.com/au/en_AU/sale/view-all-sale/'],
    },
    {
      name: 'Balmain Australia',
      url: 'https://au.balmain.com/en/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://au.balmain.com/en/sale-1/'],
    },
    {
      name: 'Givenchy Australia',
      url: 'https://www.givenchy.com/apac/en/homepage',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [
        'https://www.givenchy.com/apac/en/sale/',
        'https://www.givenchy.com/apac/en/sale/women-s-sale/',
      ],
    },
    {
      name: 'Chloe Australia',
      url: 'https://www.chloe.com/au/chloe',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [
        'https://www.chloe.com/au/chloe/shop-online/women/sale',
        'https://www.chloe.com/au/chloe/shop-online/women/sale-ready-to-wear',
      ],
    },
    {
      name: 'Moncler Australia',
      url: 'https://app-www.moncler.com/en-au/',
      suburb: 'Melbourne CBD',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Christian Louboutin Australia',
      url: 'https://apac.christianlouboutin.com/au_en',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Max Mara Australia',
      url: 'https://au.maxmara.com/home',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://au.maxmara.com/collection/maxmara'],
    },
    {
      name: 'Zimmermann Australia',
      url: 'https://www.zimmermann.com/',
      suburb: 'Bondi Junction',
      city: 'Sydney',
      catalogs: ['https://www.zimmermann.com/shop-sale'],
    },
    {
      name: 'Scanlan Theodore Australia',
      url: 'https://www.scanlantheodore.com/au/',
      suburb: 'South Yarra',
      city: 'Melbourne',
      catalogs: [
        'https://www.scanlantheodore.com/au/collections/sale-40',
        'https://www.scanlantheodore.com/au/sale-terms',
      ],
    },
    {
      name: 'CAMILLA Australia',
      url: 'https://au.camilla.com/',
      suburb: 'Alexandria',
      city: 'Sydney',
      catalogs: [
        'https://au.camilla.com/collections/sale',
        'https://au.camilla.com/collections/clearance',
        'https://au.camilla.com/pages/promotion-terms-conditions',
      ],
    },
    {
      name: 'Ralph Lauren Australia',
      url: 'https://www.ralphlauren.com.au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [
        'https://www.ralphlauren.com.au/sale',
        'https://www.ralphlauren.com.au/women/sale',
        'https://www.ralphlauren.com.au/sale/men/clothing',
      ],
    },
    {
      name: 'LOEWE Australia',
      url: 'https://www.loewe.com/int/en/home',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Hermes Australia',
      url: 'https://www.hermes.com/au/en/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'CHANEL Australia',
      url: 'https://www.chanel.com/au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Cartier Australia',
      url: 'https://www.cartier.com.au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Tiffany & Co. Australia',
      url: 'https://www.tiffany.com.au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Van Cleef & Arpels Australia',
      url: 'https://www.vancleefarpels.com/au/en.html',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Loro Piana Australia',
      url: 'https://au.loropiana.com/en/',
      suburb: 'Melbourne CBD',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Paspaley Australia',
      url: 'https://www.paspaley.com/',
      suburb: 'Brisbane CBD',
      city: 'Brisbane',
      catalogs: ['https://www.paspaley.com/collections/jewellery'],
    },
    {
      name: 'Kailis Jewellery Perth',
      url: 'https://www.kailisjewellery.com.au/',
      suburb: 'Perth CBD',
      city: 'Perth',
      catalogs: ['https://www.kailisjewellery.com.au/shop/'],
    },
    {
      name: 'Hardy Brothers Brisbane',
      url: 'https://www.hardybrothers.com.au/',
      suburb: 'Brisbane CBD',
      city: 'Brisbane',
      catalogs: ['https://www.hardybrothers.com.au/collections/jewellery-on-sale'],
    },
    {
      name: 'Natasha Schweitzer Brisbane',
      url: 'https://natashaschweitzer.com/',
      suburb: 'Fortitude Valley',
      city: 'Brisbane',
      catalogs: [
        'https://natashaschweitzer.com/collections/archive-sale',
        'https://natashaschweitzer.com/collections/sale-necklaces',
      ],
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
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: luxuryDesignerCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
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
    {
      name: 'Audio Connection Leichhardt',
      url: 'https://audioconnection.com.au/',
      suburb: 'Leichhardt',
      city: 'Sydney',
      catalogs: [
        'https://audioconnection.com.au/collections/collection',
        'https://audioconnection.com.au/collections/audio-connection-flash-sale',
        'https://audioconnection.com.au/products/linn-majik-dsm-4-streamer-amplifier-ex-demo',
      ],
    },
    {
      name: 'Len Wallis Audio Lane Cove',
      url: 'https://lenwallisaudio.com/',
      suburb: 'Lane Cove',
      city: 'Sydney',
      catalogs: ['https://lenwallisaudio.com/our-collections/open-box-ex-displays/'],
    },
    {
      name: 'Apollo Hi-Fi Marrickville',
      url: 'https://www.apollohifi.com.au/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: [
        'https://www.apollohifi.com.au/',
        'https://www.apollohifi.com.au/promotions/2025/project/fresh-sounds-sale.html',
        'https://www.apollohifi.com.au/audio.html',
      ],
    },
    {
      name: 'Minidisc Chatswood',
      url: 'https://www.minidisc.com.au/',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: ['https://www.minidisc.com.au/'],
    },
    {
      name: 'Carlton Audio Visual',
      url: 'https://www.carltonaudiovisual.com.au/',
      suburb: 'Carlton',
      city: 'Melbourne',
      catalogs: ['https://www.carltonaudiovisual.com.au/collections/clearance-1'],
    },
    {
      name: 'Tivoli Hi-Fi Hawthorn',
      url: 'https://tivolihifi.com.au/',
      suburb: 'Hawthorn',
      city: 'Melbourne',
      catalogs: [
        'https://tivolihifi.com.au/collections/sale-clearance-items',
        'https://tivolihifi.com.au/collections/ex-display-hi-fi',
      ],
    },
    {
      name: 'Melbourne Hi Fi Hawthorn',
      url: 'https://www.melbournehifi.com.au/',
      suburb: 'Hawthorn',
      city: 'Melbourne',
      catalogs: [
        'https://www.melbournehifi.com.au/collections/clearance-sale',
        'https://www.melbournehifi.com.au/collections/open-box-ex-display',
      ],
    },
    {
      name: 'Selby Acoustics Hallam',
      url: 'https://www.selby.com.au/',
      suburb: 'Hallam',
      city: 'Melbourne',
      catalogs: [
        'https://www.selby.com.au/electronics/speakers/systems/discreet-packs.html',
        'https://www.selby.com.au/pro-audio/amplifiers.html',
        'https://www.selby.com.au/brands/definitive-technology.html',
      ],
    },
    {
      name: 'Brisbane HiFi Woolloongabba',
      url: 'https://brisbanehifi.com.au/',
      suburb: 'Woolloongabba',
      city: 'Brisbane',
      catalogs: [
        'https://brisbanehifi.com.au/collections/sales',
        'https://brisbanehifi.com.au/collections/sales/ex-demo',
      ],
    },
    {
      name: 'Living Sound + Vision Fortitude Valley',
      url: 'https://www.livingsound.com.au/',
      suburb: 'Fortitude Valley',
      city: 'Brisbane',
      catalogs: ['https://www.livingsound.com.au/'],
    },
    {
      name: 'Douglas HiFi Osborne Park',
      url: 'https://www.douglashifi.com.au/',
      suburb: 'Osborne Park',
      city: 'Perth',
      catalogs: [
        'https://www.douglashifi.com.au/collections/clearance',
        'https://www.douglashifi.com.au/collections/specials-douglas-hifi-sale-clearance-and-ex-demo-items',
      ],
    },
    {
      name: 'West Coast HiFi Cannington',
      url: 'https://www.westcoasthifi.com.au/',
      suburb: 'Cannington',
      city: 'Perth',
      catalogs: ['https://www.westcoasthifi.com.au/clearance-center/'],
    },
    {
      name: 'Challenge Hi-Fi Adelaide',
      url: 'https://www.challengehifi.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [
        'https://www.challengehifi.com.au/',
        'https://www.challengehifi.com.au/audio-products',
      ],
    },
  ];

  await Promise.all(
    hifiAudioSpeakerStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: hifiAudioSpeakersCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
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
      name: 'Comedy Store Sydney Moore Park',
      url: 'https://www.comedystore.com.au/',
      suburb: 'Moore Park',
      city: 'Sydney',
      catalogs: [
        'https://www.comedystore.com.au/',
        'https://www.comedystore.com.au/event/the-friday-showcase-81/',
      ],
    },
    {
      name: 'Happy Endings Comedy Club Sydney CBD',
      url: 'https://happyendingscomedyclub.com.au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://happyendingscomedyclub.com.au/'],
    },
    {
      name: 'Metro Theatre Sydney Comedy and Music',
      url: 'https://www.metrotheatre.com.au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [
        'https://www.metrotheatre.com.au/',
        'https://www.metrotheatre.com.au/event/happy-hour/',
      ],
    },
    {
      name: 'Level One Potts Point',
      url: 'https://levelonesydney.com.au/',
      suburb: 'Potts Point',
      city: 'Sydney',
      catalogs: ['https://levelonesydney.com.au/'],
    },
    {
      name: 'Enmore Theatre Enmore',
      url: 'https://www.enmoretheatre.com.au/',
      suburb: 'Enmore',
      city: 'Sydney',
      catalogs: ['https://www.enmoretheatre.com.au/'],
    },
    {
      name: 'Factory Theatre Marrickville',
      url: 'https://www.factorytheatre.com.au/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://www.factorytheatre.com.au/'],
    },
    {
      name: 'Camelot Lounge Marrickville',
      url: 'https://camelotlounge.com/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://camelotlounge.com/events/'],
    },
    {
      name: 'Carriageworks Eveleigh',
      url: 'https://carriageworks.com.au/',
      suburb: 'Eveleigh',
      city: 'Sydney',
      catalogs: ['https://carriageworks.com.au/whats-on/'],
    },
    {
      name: 'Seymour Centre Chippendale',
      url: 'https://www.seymourcentre.com/',
      suburb: 'Chippendale',
      city: 'Sydney',
      catalogs: ['https://www.seymourcentre.com/whats-on/'],
    },
    {
      name: 'Belvoir St Theatre Surry Hills',
      url: 'https://belvoir.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://belvoir.com.au/productions/'],
    },
    {
      name: 'Riverside Theatres Parramatta',
      url: 'https://riversideparramatta.com.au/',
      suburb: 'Parramatta',
      city: 'Sydney',
      catalogs: ['https://riversideparramatta.com.au/whats-on/'],
    },
    {
      name: 'The Concourse Chatswood',
      url: 'https://www.theconcourse.com.au/',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: ['https://www.theconcourse.com.au/whats-on/'],
    },
    {
      name: 'Sydney Symphony Orchestra Student Rush',
      url: 'https://www.sydneysymphony.com/concert-tickets/ticket-information/special-pricing/student-rush',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: [
        'https://www.sydneysymphony.com/concert-tickets/ticket-information/special-pricing/student-rush',
      ],
    },
    {
      name: 'Bangarra Dance Theatre Walsh Bay',
      url: 'https://www.bangarra.com.au/',
      suburb: 'Walsh Bay',
      city: 'Sydney',
      catalogs: ['https://www.bangarra.com.au/whats-on/'],
    },
    {
      name: 'Australian Chamber Orchestra Sydney',
      url: 'https://www.aco.com.au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://www.aco.com.au/whats-on'],
    },
    {
      name: 'City Recital Hall Sydney',
      url: 'https://www.cityrecitalhall.com/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://www.cityrecitalhall.com/whats-on/'],
    },
    {
      name: 'State Theatre Sydney',
      url: 'https://www.statetheatre.com.au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://www.statetheatre.com.au/'],
    },
    {
      name: 'Theatre Royal Sydney',
      url: 'https://theatreroyalsydney.com/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://theatreroyalsydney.com/whats-on/'],
    },
    {
      name: 'Capitol Theatre Haymarket',
      url: 'https://www.capitoltheatre.com.au/',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: ['https://www.capitoltheatre.com.au/'],
    },
    {
      name: 'Sydney Lyric Theatre Pyrmont',
      url: 'https://sydneylyric.com.au/',
      suburb: 'Pyrmont',
      city: 'Sydney',
      catalogs: ['https://sydneylyric.com.au/'],
    },
    {
      name: 'Foundry Theatre Pyrmont',
      url: 'https://www.foundrytheatre.com.au/',
      suburb: 'Pyrmont',
      city: 'Sydney',
      catalogs: ['https://www.foundrytheatre.com.au/'],
    },
    {
      name: 'Sydney Festival Mob Tix',
      url: 'https://www.sydneyfestival.org.au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://www.sydneyfestival.org.au/mob-tix'],
    },
    {
      name: 'Promotix NSW Events',
      url: 'https://www.promotix.com.au/',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      catalogs: ['https://www.promotix.com.au/'],
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
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: entertainmentEventsCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: entertainmentEventsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const hobbiesClassesCategory = categories.find((category) => category.name === 'Hobbies & Classes');

  if (!hobbiesClassesCategory) {
    throw new Error('Hobbies & Classes category was not created');
  }

  const hobbiesClassesStores = [
    {
      name: 'Sydney Dance Company Classes Walsh Bay',
      url: 'https://www.sydneydancecompany.com/classes/',
      suburb: 'Walsh Bay',
      city: 'Sydney',
      catalogs: [
        'https://www.sydneydancecompany.com/classes/',
        'https://www.sydneydancecompany.com/classes/timetable/',
        'https://www.sydneydancecompany.com/classes/pricing/',
      ],
    },
    {
      name: 'Sydney Martial Arts Centre Smithfield',
      url: 'https://sydneymartialarts.com.au/',
      suburb: 'Smithfield',
      city: 'Sydney',
      catalogs: ['https://sydneymartialarts.com.au/freetrial/'],
    },
    {
      name: 'JWK North Shore Taekwondo Chatswood',
      url: 'https://www.jwknorthshore.com.au/',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: ['https://www.jwknorthshore.com.au/'],
    },
    {
      name: 'Hills District Martial Arts Castle Hill',
      url: 'https://hdma.com.au/',
      suburb: 'Castle Hill',
      city: 'Sydney',
      catalogs: ['https://hdma.com.au/free-trial/'],
    },
    {
      name: 'International Taekwondo Academy Baulkham Hills',
      url: 'https://internationaltaekwondoacademy.com.au/',
      suburb: 'Baulkham Hills',
      city: 'Sydney',
      catalogs: ['https://internationaltaekwondoacademy.com.au/'],
    },
    {
      name: 'Double Dragon Martial Arts Surry Hills',
      url: 'https://doubledragon.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://doubledragon.com.au/'],
    },
    {
      name: 'UFC Gym Parramatta Boxing',
      url: 'https://www.ufcgym.com.au/locations/parramatta/',
      suburb: 'Parramatta',
      city: 'Sydney',
      catalogs: ['https://www.ufcgym.com.au/free-trial/'],
    },
    {
      name: 'Flow Sparring Leichhardt Boxing',
      url: 'https://flowsparring.com/',
      suburb: 'Leichhardt',
      city: 'Sydney',
      catalogs: ['https://flowsparring.com/'],
    },
    {
      name: 'BodySpace Studios Marrickville Pilates',
      url: 'https://bodyspacestudios.com/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://bodyspacestudios.com/book-a-trial-class/'],
    },
    {
      name: 'Housed Pilates Five Dock',
      url: 'https://housed.com.au/',
      suburb: 'Five Dock',
      city: 'Sydney',
      catalogs: ['https://housed.com.au/intro-offer/'],
    },
    {
      name: 'One Hot Yoga Potts Point',
      url: 'https://onehotyoga.com.au/',
      suburb: 'Potts Point',
      city: 'Sydney',
      catalogs: ['https://onehotyoga.com.au/intro-offer/'],
    },
    {
      name: 'Groove Therapy Dance Marrickville',
      url: 'https://www.groovetherapy101.com/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://www.groovetherapy101.com/classes'],
    },
    {
      name: 'The Jitterbug Club Marrickville',
      url: 'https://www.thejitterbug.club/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://www.thejitterbug.club/freetrial'],
    },
    {
      name: 'Dance Central Surry Hills',
      url: 'https://dancecentral.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://dancecentral.com.au/classes/'],
    },
    {
      name: 'Powerhouse Dance Fairfield',
      url: 'https://powerhousedance.com.au/',
      suburb: 'Fairfield',
      city: 'Sydney',
      catalogs: ['https://powerhousedance.com.au/timetable/'],
    },
    {
      name: 'The Pottery Shed Surry Hills',
      url: 'https://thepotteryshed.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://thepotteryshed.com.au/collections/classes'],
    },
    {
      name: 'Silky Shapes Clay Studio Marrickville',
      url: 'https://silkyshapes.com.au/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://silkyshapes.com.au/collections/workshops'],
    },
    {
      name: 'Zentopia Studio Pottery Leichhardt',
      url: 'https://www.zentopiastudio.com/',
      suburb: 'Leichhardt',
      city: 'Sydney',
      catalogs: ['https://www.zentopiastudio.com/workshops'],
    },
    {
      name: 'Simply D Ceramics Cromer',
      url: 'https://www.simplydceramics.com/',
      suburb: 'Cromer',
      city: 'Sydney',
      catalogs: ['https://www.simplydceramics.com/classes'],
    },
    {
      name: 'Art Est Art School Leichhardt',
      url: 'https://www.artest.com.au/',
      suburb: 'Leichhardt',
      city: 'Sydney',
      catalogs: ['https://www.artest.com.au/courses'],
    },
    {
      name: 'Kumon Australia Sydney Centres',
      url: 'https://au.kumonglobal.com/find-a-centre/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://au.kumonglobal.com/find-a-centre/'],
    },
    {
      name: 'North Shore Coaching College Chatswood',
      url: 'https://www.north-shore.com.au/location/chatswood/',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: [
        'https://www.north-shore.com.au/location/chatswood/',
        'https://www.north-shore.com.au/',
      ],
    },
    {
      name: 'Matrix Education Chatswood',
      url: 'https://www.matrix.edu.au/campuses/chatswood/',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: ['https://www.matrix.edu.au/campuses/chatswood/'],
    },
    {
      name: 'Matrix Education Parramatta',
      url: 'https://www.matrix.edu.au/campuses/parramatta/',
      suburb: 'Parramatta',
      city: 'Sydney',
      catalogs: ['https://www.matrix.edu.au/campuses/parramatta/'],
    },
    {
      name: 'Dymocks Tutoring Hurstville',
      url: 'https://www.dymockstutoring.edu.au/locations/hurstville/',
      suburb: 'Hurstville',
      city: 'Sydney',
      catalogs: ['https://www.dymockstutoring.edu.au/locations/hurstville/'],
    },
    {
      name: 'Mathspace Coaching Sydney',
      url: 'https://mathspace.co/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://mathspace.co/'],
    },
    {
      name: 'JUMP Swim Schools Seven Hills',
      url: 'https://jumpswimschools.com.au/locations/seven-hills/',
      suburb: 'Seven Hills',
      city: 'Sydney',
      catalogs: ['https://jumpswimschools.com.au/locations/seven-hills/'],
    },
    {
      name: 'Carlile Swimming Ryde',
      url: 'https://www.carlile.com.au/locations/ryde/',
      suburb: 'Ryde',
      city: 'Sydney',
      catalogs: ['https://www.carlile.com.au/locations/ryde/'],
    },
    {
      name: 'Climb Fit St Leonards',
      url: 'https://www.climbfit.com.au/st-leonards/',
      suburb: 'St Leonards',
      city: 'Sydney',
      catalogs: ['https://www.climbfit.com.au/st-leonards/'],
    },
    {
      name: '9 Degrees Alexandria Bouldering',
      url: 'https://www.9degrees.com.au/alexandria',
      suburb: 'Alexandria',
      city: 'Sydney',
      catalogs: ['https://www.9degrees.com.au/alexandria'],
    },
    {
      name: 'Nomad Bouldering Annandale',
      url: 'https://nomadbouldering.com.au/',
      suburb: 'Annandale',
      city: 'Sydney',
      catalogs: ['https://nomadbouldering.com.au/first-visit/'],
    },
    {
      name: 'Sydney Seafood School Pyrmont',
      url: 'https://www.sydneyfishmarket.com.au/Sydney-Seafood-School',
      suburb: 'Pyrmont',
      city: 'Sydney',
      catalogs: ['https://www.sydneyfishmarket.com.au/Sydney-Seafood-School/Classes'],
    },
    {
      name: 'Vive Cooking School Rosebery',
      url: 'https://vivecookingschool.com.au/',
      suburb: 'Rosebery',
      city: 'Sydney',
      catalogs: ['https://vivecookingschool.com.au/classes/'],
    },
    {
      name: 'Sydney Cooking School Neutral Bay',
      url: 'https://www.sydneycookingschool.com.au/',
      suburb: 'Neutral Bay',
      city: 'Sydney',
      catalogs: ['https://www.sydneycookingschool.com.au/classes/'],
    },
    {
      name: 'Australian Institute of Music Surry Hills',
      url: 'https://aim.edu.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://aim.edu.au/open-days-and-events/'],
    },
    {
      name: 'International School of Music Chatswood',
      url: 'https://ismchatswood.com.au/',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: ['https://ismchatswood.com.au/'],
    },
    {
      name: 'Singing Lessons Sydney Surry Hills',
      url: 'https://singinglessonssydney.com.au/',
      suburb: 'Surry Hills',
      city: 'Sydney',
      catalogs: ['https://singinglessonssydney.com.au/'],
    },
  ];

  await Promise.all(
    hobbiesClassesStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: hobbiesClassesCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: hobbiesClassesCategory.id,
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
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Fig & Bloom',
      url: 'https://figandbloom.com/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://figandbloom.com/pages/offer_page'],
    },
    {
      name: 'Daily Blooms',
      url: 'https://dailyblooms.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Flowers Across Australia',
      url: 'https://www.flowersacross.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'LVLY Australia',
      url: 'https://www.lvly.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'The Hamper Emporium',
      url: 'https://www.thehamperemporium.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.thehamperemporium.com.au/collections/25-off-selected-hampers'],
    },
    {
      name: 'Edible Blooms',
      url: 'https://www.edibleblooms.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.edibleblooms.com.au/pages/shop-by-category'],
    },
    {
      name: 'Gifts Australia',
      url: 'https://www.giftsaustralia.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.giftsaustralia.com.au/clearance'],
    },
    {
      name: 'Hardtofind Australia',
      url: 'https://www.hardtofind.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.hardtofind.com.au/sale'],
    },
    {
      name: 'The Gifting Emporium',
      url: 'https://thegiftingemporium.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://thegiftingemporium.com.au/shop/'],
    },
    {
      name: 'Pearsons Florist Bondi',
      url: 'https://pearsonsflorist.com.au/',
      suburb: 'Bondi',
      city: 'Sydney',
      catalogs: [
        'https://pearsonsflorist.com.au/online-flowers',
        'https://pearsonsflorist.com.au/categories/best-sellers',
        'https://pearsonsflorist.com.au/categories/luxe-range',
      ],
    },
    {
      name: 'Floral Expressions Northmead',
      url: 'https://www.floralexpressions.com.au/',
      suburb: 'Northmead',
      city: 'Sydney',
      catalogs: [
        'https://www.floralexpressions.com.au/sydney-flowers/northmead',
        'https://www.floralexpressions.com.au/flower-native-and-wildflowers/',
      ],
    },
    {
      name: 'Poho Flowers Potts Point',
      url: 'https://www.poho.com.au/',
      suburb: 'Potts Point',
      city: 'Sydney',
      catalogs: [
        'https://togo.poho.com.au/',
        'https://www.poho.com.au/',
      ],
    },
    {
      name: 'My Violet Redfern',
      url: 'https://www.myviolet.com.au/',
      suburb: 'Redfern',
      city: 'Sydney',
      catalogs: ['https://www.myviolet.com.au/shop'],
    },
    {
      name: 'Urban Flowers Homebush',
      url: 'https://www.urbanflower.com.au/sydney-florist/sydney.shtml',
      suburb: 'Homebush',
      city: 'Sydney',
      catalogs: [
        'https://www.urbanflower.com.au/sydney-florist/sydney.shtml',
        'https://www.urbanflower.com.au/sydney-florist/afterpay-flowers-sydney.shtml',
      ],
    },
    {
      name: 'Garden of Angels Stanmore',
      url: 'https://www.gardenofangels.com.au/',
      suburb: 'Stanmore',
      city: 'Sydney',
      catalogs: ['https://www.gardenofangels.com.au/shop'],
    },
    {
      name: 'Flowers Vasette Fitzroy',
      url: 'https://flowersvasette.com.au/',
      suburb: 'Fitzroy',
      city: 'Melbourne',
      catalogs: ['https://flowersvasette.com.au/shop/'],
    },
    {
      name: 'In Full Bloom South Melbourne',
      url: 'https://www.infullbloom.com.au/',
      suburb: 'South Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.infullbloom.com.au/shop/'],
    },
    {
      name: 'The Flower Merchant Moonee Ponds',
      url: 'https://theflowermerchant.com.au/',
      suburb: 'Moonee Ponds',
      city: 'Melbourne',
      catalogs: [
        'https://theflowermerchant.com.au/shop/',
        'https://theflowermerchant.com.au/collections/romance-collection',
      ],
    },
    {
      name: 'Quiet Bloom Richmond',
      url: 'https://quietbloom.com.au/',
      suburb: 'Richmond',
      city: 'Melbourne',
      catalogs: ['https://quietbloom.com.au/'],
    },
    {
      name: 'Victoria Whitelaw South Yarra',
      url: 'https://www.victoriawhitelaw.com.au/',
      suburb: 'South Yarra',
      city: 'Melbourne',
      catalogs: ['https://www.victoriawhitelaw.com.au/'],
    },
    {
      name: 'Flower Club Ivanhoe',
      url: 'https://flowerclub.com.au/',
      suburb: 'Ivanhoe',
      city: 'Melbourne',
      catalogs: [
        'https://flowerclub.com.au/',
        'https://flowerclub.com.au/florist-melbourne/',
      ],
    },
    {
      name: 'Mister Botanical Brisbane CBD',
      url: 'https://www.misterbotanical.com.au/',
      suburb: 'Brisbane CBD',
      city: 'Brisbane',
      catalogs: ['https://www.misterbotanical.com.au/flower-delivery-fortitude-valley'],
    },
    {
      name: 'Flowers Across Brisbane Acacia Ridge',
      url: 'https://www.flowersacrossbrisbane.com.au/',
      suburb: 'Acacia Ridge',
      city: 'Brisbane',
      catalogs: [
        'https://www.flowersacrossbrisbane.com.au/send-flowers/fortitude-valley/',
        'https://www.flowersacrossbrisbane.com.au/send-flowers/fortitude-valley/?price_range=all',
      ],
    },
    {
      name: 'Poco Posy Brisbane',
      url: 'https://www.pocoposy.com.au/',
      suburb: 'Hendra',
      city: 'Brisbane',
      catalogs: [
        'https://www.pocoposy.com.au/',
        'https://www.pocoposy.com.au/fortitude-valley/',
      ],
    },
    {
      name: 'Perrotts Florists Brisbane',
      url: 'https://www.perrotts.com.au/',
      suburb: 'Brisbane CBD',
      city: 'Brisbane',
      catalogs: ['https://www.perrotts.com.au/'],
    },
    {
      name: 'Bloom & Rocket Indooroopilly',
      url: 'https://www.bloomandrocket.com/',
      suburb: 'Indooroopilly',
      city: 'Brisbane',
      catalogs: ['https://www.bloomandrocket.com/'],
    },
    {
      name: 'Poppy Rose Brisbane',
      url: 'https://poppyrose.com.au/',
      suburb: 'Newstead',
      city: 'Brisbane',
      catalogs: [
        'https://poppyrose.com.au/pages/flower-delivery-fortitude-valley',
        'https://poppyrose.com.au/collections/flowers',
      ],
    },
    {
      name: 'Floral State Perth',
      url: 'https://www.floralstate.com.au/',
      suburb: 'Perth',
      city: 'Perth',
      catalogs: ['https://www.floralstate.com.au/'],
    },
    {
      name: 'Little Posy Fremantle',
      url: 'https://www.littleposy.com.au/',
      suburb: 'Fremantle',
      city: 'Perth',
      catalogs: [
        'https://www.littleposy.com.au/',
        'https://www.littleposy.com.au/products/daily-mixed-posy',
      ],
    },
    {
      name: 'The Flower Run Perth',
      url: 'https://theflowerrun.com.au/',
      suburb: 'Perth',
      city: 'Perth',
      catalogs: ['https://theflowerrun.com.au/'],
    },
    {
      name: 'Green Bunch East Victoria Park',
      url: 'https://greenbunch.com.au/',
      suburb: 'East Victoria Park',
      city: 'Perth',
      catalogs: [
        'https://greenbunch.com.au/products/flowers/',
        'https://greenbunch.com.au/products/flowers/page/2/',
      ],
    },
    {
      name: 'Tynte Flowers North Adelaide',
      url: 'https://tynte.com/',
      suburb: 'North Adelaide',
      city: 'Adelaide',
      catalogs: [
        'https://tynte.com/',
        'https://tynte.com/a-little-thought/',
        'https://tynte.com/collections/bouquets',
      ],
    },
    {
      name: 'East End Flower Market Adelaide',
      url: 'https://eastendflowermarket.com.au/',
      suburb: 'Adelaide CBD',
      city: 'Adelaide',
      catalogs: [
        'https://eastendflowermarket.com.au/',
        'https://eastendflowermarket.com.au/pages/florist-adelaide',
      ],
    },
    {
      name: 'Floraly Australia',
      url: 'https://www.floraly.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.floraly.com.au/',
        'https://www.floraly.com.au/pages/prospect-flower-delivery-5082',
      ],
    },
  ];

  await Promise.all(
    giftsFlowerStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: giftsFlowersCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
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
      suburb: 'Milperra',
      city: 'Sydney',
      catalogs: ['https://www.flowerpower.com.au/sale'],
    },
    {
      name: 'Pots and Plants Direct Parklea',
      url: 'https://www.potsandplants.com.au/',
      suburb: 'Parklea',
      city: 'Sydney',
      catalogs: ['https://www.potsandplants.com.au/'],
    },
    {
      name: 'Bonnyrigg Garden Centre',
      url: 'https://bonnyrigggardencentre.com.au/',
      suburb: 'Bonnyrigg',
      city: 'Sydney',
      catalogs: ['https://bonnyrigggardencentre.com.au/'],
    },
    {
      name: 'Spring Colours Nursery Dural',
      url: 'https://springcolours.com.au/',
      suburb: 'Dural',
      city: 'Sydney',
      catalogs: ['https://springcolours.com.au/'],
    },
    {
      name: "Swane's Nurseries Dural",
      url: 'https://www.swanes.com/',
      suburb: 'Dural',
      city: 'Sydney',
      catalogs: ['https://www.swanes.com/'],
    },
    {
      name: 'The Jungle Collective Australia',
      url: 'https://www.thejunglecollective.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.thejunglecollective.com.au/plant-accessories-store/',
        'https://www.thejunglecollective.com.au/',
      ],
    },
    {
      name: 'The Grow Centre Brisbane',
      url: 'https://www.thegrowcentre.com.au/',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: ['https://www.thegrowcentre.com.au/'],
    },
    {
      name: "Diaco's Garden Nursery Heatherton",
      url: 'https://diacos.com.au/',
      suburb: 'Heatherton',
      city: 'Melbourne',
      catalogs: [
        'https://diacos.com.au/',
        'https://diacos.com.au/online-plants/',
        'https://diacos.com.au/plant-pots/',
      ],
    },
    {
      name: 'Aumanns Garden Supplies Plenty',
      url: 'https://www.aumanns.com.au/',
      suburb: 'Plenty',
      city: 'Melbourne',
      catalogs: ['https://www.aumanns.com.au/'],
    },
    {
      name: 'Gardenworld Braeside',
      url: 'https://www.gardenworld.com.au/',
      suburb: 'Braeside',
      city: 'Melbourne',
      catalogs: ['https://www.gardenworld.com.au/'],
    },
    {
      name: "Van Loon's Nursery Wallington",
      url: 'https://www.vanloonsnursery.com.au/',
      suburb: 'Wallington',
      city: 'Geelong',
      catalogs: ['https://www.vanloonsnursery.com.au/'],
    },
    {
      name: "Sam's Garden Centre Ipswich",
      url: 'https://www.samsgardencentre.com.au/',
      suburb: 'Ipswich',
      city: 'Brisbane',
      catalogs: ['https://www.samsgardencentre.com.au/'],
    },
    {
      name: 'Brookfield Gardens Brisbane',
      url: 'https://brookfieldgardens.com.au/',
      suburb: 'Brookfield',
      city: 'Brisbane',
      catalogs: ['https://brookfieldgardens.com.au/'],
    },
    {
      name: 'Plants in a Box Currumbin Valley',
      url: 'https://plantsinabox.com.au/',
      suburb: 'Currumbin Valley',
      city: 'Gold Coast',
      catalogs: [
        'https://plantsinabox.com.au/',
        'https://plantsinabox.com.au/collections/the-best-plants-for-brisbane',
      ],
    },
    {
      name: 'Waldecks Garden Centres Perth',
      url: 'https://www.waldecks.com.au/',
      suburb: 'Kingsley',
      city: 'Perth',
      catalogs: ['https://www.waldecks.com.au/'],
    },
    {
      name: "Dawson's Garden World Forrestfield",
      url: 'https://dawsonsgardenworld.com.au/',
      suburb: 'Forrestfield',
      city: 'Perth',
      catalogs: [
        'https://dawsonsgardenworld.com.au/',
        'https://dawsonsgardenworld.com.au/plants/',
      ],
    },
    {
      name: "Newman's Nursery Tea Tree Gully",
      url: 'https://newmansnursery.com.au/',
      suburb: 'Tea Tree Gully',
      city: 'Adelaide',
      catalogs: [
        'https://newmansnursery.com.au/',
        'https://newmansnursery.com.au/plant-range/',
      ],
    },
    {
      name: 'Garden Grove Golden Grove',
      url: 'https://gardengrove.com.au/',
      suburb: 'Golden Grove',
      city: 'Adelaide',
      catalogs: ['https://gardengrove.com.au/'],
    },
    {
      name: 'Virginia Home & Garden Adelaide',
      url: 'https://virginiahomeandgarden.com.au/',
      suburb: 'Virginia',
      city: 'Adelaide',
      catalogs: ['https://virginiahomeandgarden.com.au/'],
    },
    {
      name: 'Klemzig Garden Centre',
      url: 'https://www.klemziggardencentre.com/',
      suburb: 'Klemzig',
      city: 'Adelaide',
      catalogs: ['https://www.klemziggardencentre.com/'],
    },
    {
      name: 'The Garden Depot Mount Barker',
      url: 'https://www.thegardendepot.com.au/',
      suburb: 'Mount Barker',
      city: 'Adelaide',
      catalogs: ['https://www.thegardendepot.com.au/'],
    },
    {
      name: 'Dural Plant Market',
      url: 'https://www.duralplantmarket.com.au/',
      suburb: 'Dural',
      city: 'Sydney',
      catalogs: ['https://www.duralplantmarket.com.au/'],
    },
    {
      name: "Engall's Nursery Dural",
      url: 'https://www.engalls.com.au/',
      suburb: 'Dural',
      city: 'Sydney',
      catalogs: [
        'https://www.engalls.com.au/',
        'https://www.engalls.com.au/our-products/',
      ],
    },
    {
      name: 'Acorn Nursery Surrey Hills',
      url: 'https://acornnursery.com.au/',
      suburb: 'Surrey Hills',
      city: 'Melbourne',
      catalogs: [
        'https://acornnursery.com.au/',
        'https://acornnursery.com.au/pages/our-story',
      ],
    },
    {
      name: 'TheTreeShop Surrey Hills',
      url: 'https://www.thetreeshop.com.au/',
      suburb: 'Surrey Hills',
      city: 'Melbourne',
      catalogs: ['https://www.thetreeshop.com.au/'],
    },
    {
      name: 'Oxley Nursery Brisbane',
      url: 'https://www.oxleynursery.com.au/',
      suburb: 'Oxley',
      city: 'Brisbane',
      catalogs: ['https://www.oxleynursery.com.au/'],
    },
    {
      name: "Theo's Garden Centre Kallangur",
      url: 'https://www.theosnursery.com/',
      suburb: 'Kallangur',
      city: 'Brisbane',
      catalogs: [
        'https://www.theosnursery.com/',
        'https://www.theosnursery.com/contact-us/',
      ],
    },
    {
      name: 'Dalys Native Plants Mansfield',
      url: 'https://dalysnativeplants.com.au/',
      suburb: 'Mansfield',
      city: 'Brisbane',
      catalogs: ['https://dalysnativeplants.com.au/'],
    },
    {
      name: 'Zanthorrea Nursery Maida Vale',
      url: 'https://www.zanthorrea.com/',
      suburb: 'Maida Vale',
      city: 'Perth',
      catalogs: [
        'https://www.zanthorrea.com/',
        'https://www.zanthorrea.com/nursery-plants-perth/',
      ],
    },
    {
      name: 'Native Spirit Nursery Perth',
      url: 'https://nativespiritnursery.com.au/',
      suburb: 'Oakford',
      city: 'Perth',
      catalogs: ['https://nativespiritnursery.com.au/'],
    },
    {
      name: "Heyne's Garden Centre Adelaide",
      url: 'https://heyne.com.au/',
      suburb: 'Norwood',
      city: 'Adelaide',
      catalogs: [
        'https://heyne.com.au/',
        'https://heyne.com.au/outdoor-plants/garden-plants-shrubs-bushes',
      ],
    },
    {
      name: 'State Flora Belair',
      url: 'https://www.stateflora.sa.gov.au/buy-plants',
      suburb: 'Belair',
      city: 'Adelaide',
      catalogs: ['https://www.stateflora.sa.gov.au/buy-plants'],
    },
    {
      name: 'Provenance Indigenous Plants Adelaide',
      url: 'https://provenance.net.au/',
      suburb: 'Salisbury',
      city: 'Adelaide',
      catalogs: ['https://provenance.net.au/'],
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
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: homeGardenCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
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
      name: 'Coach Australia',
      url: 'https://au.coach.com/shop?filterCategory=Bags',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://au.coach.com/shop/sale/womens-sale/view-all?filterCategory=Bags',
        'https://au.coach.com/shop/outlet/clearance/view-all?filterCategory=Bags',
      ],
    },
    {
      name: 'Kate Spade Australia',
      url: 'https://katespade.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://katespade.com.au/shop/sale/sale/view-all'],
    },
    {
      name: 'Michael Kors Australia',
      url: 'https://www.michaelkors.global/au/en/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.michaelkors.global/au/en/sale/',
        'https://www.michaelkors.global/au/en/sale/handbags/',
      ],
    },
    {
      name: 'MIMCO Bags Australia',
      url: 'https://www.mimco.com.au/bags',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.mimco.com.au/sale/bags'],
    },
    {
      name: 'Longchamp Australia',
      url: 'https://www.longchamp.com/au/en/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.longchamp.com/au/en/sales-au.html'],
    },
    {
      name: 'Furla Australia',
      url: 'https://www.furla.com/au/en/eshop/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.furla.com/au/en/eshop/',
        'https://www.furla.com/au/en/eshop/sale/sale-woman/white/',
      ],
    },
    {
      name: 'Marc Jacobs Australia',
      url: 'https://www.marcjacobs.com/au-en/homepage.html',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.marcjacobs.com/au-en/the-marc-jacobs/marcdown/bags/'],
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
    {
      name: 'R.M.Williams Australia',
      url: 'https://www.rmwilliams.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: ['https://www.rmwilliams.com.au/sale?lang=en_AU'],
    },
    {
      name: 'Aquila Australia',
      url: 'https://www.aquila.com.au/home',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.aquila.com.au/sale'],
    },
    {
      name: 'The Horse Leather Goods',
      url: 'https://www.thehorse.com.au/collections/handbags',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.thehorse.com.au/collections/sale',
        'https://www.thehorse.com.au/collections/all-leather-goods',
      ],
    },
    {
      name: 'Cadelle Leather Melbourne',
      url: 'https://cadelleleather.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://cadelleleather.com.au/collections/sale-handbags'],
    },
    {
      name: 'BARE Leather Perth',
      url: 'https://bareleather.com.au/',
      suburb: 'Perth',
      city: 'Perth',
      catalogs: [
        'https://bareleather.com.au/collections/sale-items',
        'https://bareleather.com.au/collections/shop-30-off',
      ],
    },
    {
      name: 'Bally Australia',
      url: 'https://www.bally.com.au/en/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://www.bally.com.au/en/category/women-sale-bags/',
        'https://www.bally.com.au/en/category/men-sale-bags/',
      ],
    },
    {
      name: 'ECCO Bags Australia',
      url: 'https://au.ecco.com/bags',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://au.ecco.com/sale/bags-and-accessories',
        'https://au.ecco.com/sale/40sales',
      ],
    },
    {
      name: 'The Jacket Maker Australia',
      url: 'https://www.thejacketmaker.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.thejacketmaker.com.au/collections/clearance-sale'],
    },
    {
      name: 'MON Purse Australia',
      url: 'https://monpurse.com/collections/sale-bags',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://monpurse.com/collections/sale-bags',
        'https://monpurse.com/collections/work-bags',
      ],
    },
    {
      name: 'Deadly Ponies Australia',
      url: 'https://deadlyponies.com/au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://deadlyponies.com/pages/promotions'],
    },
    {
      name: 'Bellroy Leather Bags Australia',
      url: 'https://bellroy.com/products/category/leather-bags',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://bellroy.com/products/category/outlet'],
    },
  ];

  await Promise.all(
    leatherJacketBagStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: leatherJacketsBagsCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: leatherJacketsBagsCategory.id,
          url: store.url,
          ownerId: user.id,
        },
      })
    )
  );

  const factoryOutletsCategory = categories.find((category) => category.name === 'Factory Outlets');

  if (!factoryOutletsCategory) {
    throw new Error('Factory Outlets category was not created');
  }

  const factoryOutletStores = [
    {
      name: 'Oroton Outlet',
      url: 'https://oroton.com/outlet/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://oroton.com/outlet/'],
    },
    {
      name: 'Coach Outlet Australia',
      url: 'https://au.coach.com/shop/outlet',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [
        'https://au.coach.com/shop/outlet',
        'https://au.coach.com/shop/outlet/clearance/view-all?filterCategory=Bags',
      ],
    },
    {
      name: 'Country Road & Trenery Outlet',
      url: 'https://outlet.countryroad.com.au/',
      suburb: 'Eastern Creek',
      city: 'Sydney',
      catalogs: ['https://outlet.countryroad.com.au/'],
    },
    {
      name: 'M.J. Bale Outlet Stores',
      url: 'https://www.mjbale.com/pages/outlet-stores',
      suburb: 'Homebush',
      city: 'Sydney',
      catalogs: ['https://www.mjbale.com/pages/outlet-stores'],
    },
    {
      name: 'Politix Canberra Outlet',
      url: 'https://www.politix.com.au/stores/ACT-Canberra-Outlet-Centre',
      suburb: 'Fyshwick',
      city: 'Canberra',
      catalogs: ['https://www.politix.com.au/stores/ACT-Canberra-Outlet-Centre'],
    },
    {
      name: 'Skechers Canberra Outlet',
      url: 'https://canberraoutlet.com.au/stores/skechers',
      suburb: 'Fyshwick',
      city: 'Canberra',
      catalogs: ['https://canberraoutlet.com.au/stores/skechers'],
    },
    {
      name: 'Superdry Outlet',
      url: 'https://www.superdry.com/outlet/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.superdry.com/outlet/'],
    },
    {
      name: 'Ted Baker Outlet',
      url: 'https://www.tedbaker.com/collections/outlet',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.tedbaker.com/collections/outlet'],
    },
    {
      name: 'Armani Exchange Outlet Australia',
      url: 'https://www.armani.com/en-au/armani-exchange/outlet/',
      suburb: 'South Wharf',
      city: 'Melbourne',
      catalogs: ['https://www.armani.com/en-au/armani-exchange/outlet/'],
    },
    {
      name: 'Armani Outlet Australia',
      url: 'https://locations.armani.com/en/armani-outlet/australia',
      suburb: 'Homebush',
      city: 'Sydney',
      catalogs: ['https://locations.armani.com/en/armani-outlet/australia'],
    },
    {
      name: 'BOSS Outlet Homebush',
      url: 'https://www.hugoboss.com/au/boss-outlet-3-1-5-underwood-road-sydney-homebush-nsw/',
      suburb: 'Homebush',
      city: 'Sydney',
      catalogs: [
        'https://www.hugoboss.com/au/boss-outlet-3-1-5-underwood-road-sydney-homebush-nsw/',
      ],
    },
    {
      name: "Arc'teryx Outlet Australia",
      url: 'https://arcteryx.com.au/collections/outlet',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://arcteryx.com.au/collections/outlet'],
    },
    {
      name: 'Canada Goose Outlet Australia',
      url: 'https://www.canadagoose.com/au/en/outlet',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.canadagoose.com/au/en/outlet'],
    },
    {
      name: 'Under Armour Outlet Australia',
      url: 'https://www.underarmour.com.au/en-au/c/outlet/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.underarmour.com.au/en-au/c/outlet/'],
    },
    {
      name: 'Salomon Outlet Australia',
      url: 'https://salomon.com.au/collections/outlet',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://salomon.com.au/collections/outlet'],
    },
    {
      name: 'Oxford Outlet Suits',
      url: 'https://www.oxfordshop.com.au/collections/mens-outlet-suits',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.oxfordshop.com.au/collections/mens-outlet-suits'],
    },
    {
      name: 'Typo Outlet Australia',
      url: 'https://typo.com/AU/outlet/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://typo.com/AU/outlet/'],
    },
    {
      name: 'Bellroy Outlet',
      url: 'https://bellroy.com/products/category/outlet',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://bellroy.com/products/category/outlet'],
    },
  ];

  await Promise.all(
    factoryOutletStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: factoryOutletsCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: factoryOutletsCategory.id,
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
      suburb: 'Alexandria',
      city: 'Sydney',
      catalogs: [
        'https://www.petcircle.com.au/sale/',
        'https://www.petcircle.com.au/collection/offers',
        'https://www.petcircle.com.au/collection/specials?offer-badge=SALE',
      ],
    },
    {
      name: 'Petbarn Australia',
      url: 'https://www.petbarn.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://www.petbarn.com.au/c/flash-sale', 'https://www.petbarn.com.au/sale'],
    },
    {
      name: 'PETstock Australia',
      url: 'https://www.petstock.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.petstock.com.au/collections/sale'],
    },
    {
      name: 'Budget Pet Products',
      url: 'https://www.budgetpetproducts.com.au/',
      suburb: 'Molendinar',
      city: 'Gold Coast',
      catalogs: ['https://www.budgetpetproducts.com.au/sale'],
    },
    {
      name: 'My Pet Warehouse',
      url: 'https://www.mypetwarehouse.com.au/',
      suburb: 'South Melbourne',
      city: 'Melbourne',
      catalogs: ['https://www.mypetwarehouse.com.au/sale'],
    },
    {
      name: 'VetSupply Australia',
      url: 'https://www.vetsupply.com.au/',
      suburb: 'Seven Hills',
      city: 'Sydney',
      catalogs: ['https://www.vetsupply.com.au/specials.aspx'],
    },
    {
      name: 'Jumbo Pets Australia',
      url: 'https://www.jumbopets.com.au/',
      suburb: 'Campbelltown',
      city: 'Sydney',
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
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://peto.com.au/collections/sale'],
    },
    {
      name: 'Pet House Australia',
      url: 'https://pethouse.com.au/',
      catalogs: ['https://pethouse.com.au/collections/sale'],
    },
    {
      name: 'Kellyville Pets Beaumont Hills',
      url: 'https://www.kellyvillepets.com.au/',
      suburb: 'Beaumont Hills',
      city: 'Sydney',
      catalogs: [
        'https://www.kellyvillepets.com.au/collections/sale',
        'https://www.kellyvillepets.com.au/pages/sales-and-discounts',
        'https://www.kellyvillepets.com.au/pages/black-friday-pet-sale',
      ],
    },
    {
      name: 'Petcare Warehouse Sydney',
      url: 'https://petcare2000.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://petcare2000.com.au/'],
    },
    {
      name: 'Petso Rhodes',
      url: 'https://www.petso.com.au/',
      suburb: 'Rhodes',
      city: 'Sydney',
      catalogs: [
        'https://www.petso.com.au/collections/clearance',
        'https://www.petso.com.au/collections/clearance-starts-on-pet-essentials',
      ],
    },
    {
      name: 'iPetStore Kirrawee',
      url: 'https://ipetstore.com.au/',
      suburb: 'Kirrawee',
      city: 'Sydney',
      catalogs: [
        'https://ipetstore.com.au/clearance',
        'https://ipetstore.com.au/home',
      ],
    },
    {
      name: 'Pet Food Plus Roselands',
      url: 'https://www.petfoodplus.com.au/',
      suburb: 'Roselands',
      city: 'Sydney',
      catalogs: ['https://www.petfoodplus.com.au/pet-supplies/'],
    },
    {
      name: 'Habitat Pet Supplies Altona North',
      url: 'https://www.habitatpets.com.au/pages/habitat-pet-supplies-altona-north',
      suburb: 'Altona North',
      city: 'Melbourne',
      catalogs: [
        'https://www.habitatpets.com.au/collections/clearance',
        'https://www.habitatpets.com.au/',
      ],
    },
    {
      name: 'Habitat Pet Supplies North Melbourne',
      url: 'https://www.habitatpets.com.au/pages/habitat-north-melbourne',
      suburb: 'North Melbourne',
      city: 'Melbourne',
      catalogs: [
        'https://www.habitatpets.com.au/collections/clearance',
        'https://www.habitatpets.com.au/',
      ],
    },
    {
      name: 'ADS Pet Store Moorabbin',
      url: 'https://adspet.com.au/pages/store-locator',
      suburb: 'Moorabbin',
      city: 'Melbourne',
      catalogs: ['https://adspet.com.au/pages/store-locator'],
    },
    {
      name: 'PIKAPET Collingwood',
      url: 'https://pikapet.com.au/',
      suburb: 'Collingwood',
      city: 'Melbourne',
      catalogs: [
        'https://pikapet.com.au/collections/clearance',
        'https://pikapet.com.au/',
      ],
    },
    {
      name: 'Pet City Mount Gravatt',
      url: 'https://www.petcity.com.au/',
      suburb: 'Mount Gravatt',
      city: 'Brisbane',
      catalogs: [
        'https://www.petcity.com.au/sale/clearance/',
        'https://www.petcity.com.au/spring-cleanout-sale/',
        'https://www.petcity.com.au/vip-club/',
      ],
    },
    {
      name: 'Pets Unleashed Morningside',
      url: 'https://www.petsunleashed.com.au/',
      suburb: 'Morningside',
      city: 'Brisbane',
      catalogs: [
        'https://www.petsunleashed.com.au/',
        'https://www.petsunleashed.com.au/pages/our-retail-store',
      ],
    },
    {
      name: 'Pets of Sandgate',
      url: 'https://www.petsofsandgate.com.au/',
      suburb: 'Sandgate',
      city: 'Brisbane',
      catalogs: [
        'https://www.petsofsandgate.com.au/',
        'https://www.petsofsandgate.com.au/brand/simparica-trio/',
      ],
    },
    {
      name: 'RSPCA World For Pets Wacol',
      url: 'https://www.rspca.charity/rspca-pet-supplies/world-for-pets-wacol',
      suburb: 'Wacol',
      city: 'Brisbane',
      catalogs: [
        'https://www.rspca.charity/rspca-pet-supplies/world-for-pets-wacol',
        'https://www.rspcaworldforpets.com.au/',
      ],
    },
    {
      name: 'Vet-n-pet DIRECT Queensland',
      url: 'https://www.vetnpetdirect.com.au/',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: ['https://www.vetnpetdirect.com.au/collections/all/sale_on-sale'],
    },
    {
      name: 'Pet Supplies Perth',
      url: 'https://www.petsuppliesperth.com.au/',
      suburb: 'Perth',
      city: 'Perth',
      catalogs: ['https://www.petsuppliesperth.com.au/dog'],
    },
    {
      name: 'Olivers Pets & Plants Glengowrie',
      url: 'https://www.oliverspetsandplants.com.au/',
      suburb: 'Glengowrie',
      city: 'Adelaide',
      catalogs: ['https://www.oliverspetsandplants.com.au/'],
    },
  ];

  await Promise.all(
    petSupplyStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: petsSuppliesCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb || 'Sydney',
          city: store.city || 'Sydney',
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

  const streetFoodTakeawayCategory = categories.find((category) => category.name === 'Cultural Bites & Takeaway');

  if (!streetFoodTakeawayCategory) {
    throw new Error('Cultural Bites & Takeaway category was not created');
  }

  const streetFoodTakeawayStores = [
    {
      name: 'VN Street Foods Marrickville',
      url: 'https://www.vnstreetfoods.com.au/home',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Hello Auntie Marrickville',
      url: 'https://hello-auntie.com.au/',
      suburb: 'Marrickville',
      city: 'Sydney',
      catalogs: ['https://hello-auntie.com.au/menu/'],
    },
    {
      name: 'Great Aunty Three',
      url: 'https://greatauntythree.com/',
      suburb: 'Enmore',
      city: 'Sydney',
      catalogs: ['https://greatauntythree.com/menu/'],
    },
    {
      name: 'Marrickville Pork Roll Darling Square',
      url: 'https://www.darlingharbour.com/eat-drink/marrickville-pork-roll',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Tan Viet Noodle House Cabramatta',
      url: 'https://tanviet.com.au/',
      suburb: 'Cabramatta',
      city: 'Sydney',
      catalogs: ['https://tanviet.com.au/locations/'],
    },
    {
      name: 'Bau Truong Cabramatta',
      url: 'https://www.bautruong.com.au/',
      suburb: 'Cabramatta',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Pho Tau Bay Cabramatta',
      url: 'https://restaurantguru.com/Pho-Tau-Bay-Cabramatta-2',
      suburb: 'Cabramatta',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Tam Broken Rice Canley Vale',
      url: 'https://australia.chamberofcommerce.com/business-directory/new-south-wales/canley-vale/vietnamese-restaurant/4080877-tam-broken-rice-vietnamese-restaurant',
      suburb: 'Canley Vale',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Banh Mi Bay Ngo Bankstown',
      url: 'https://www.timeout.com/sydney/restaurants/banh-mi-bay-ngo',
      suburb: 'Bankstown',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: "Roll'd Sydney",
      url: 'https://rolld.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: ['https://rolld.com.au/offers/'],
    },
    {
      name: 'Saigon Summer',
      url: 'https://saigonsummer.com.au/',
      suburb: 'Sydney Olympic Park',
      city: 'Sydney',
      catalogs: ['https://saigonsummer.com.au/about-us/'],
    },
    {
      name: 'Ho Jiak Haymarket',
      url: 'https://www.hojiak.com.au/haymarket/',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: ['https://www.hojiak.com.au/whats-on/'],
    },
    {
      name: 'Mamak Haymarket',
      url: 'https://www.mamak.com.au/#haymarket',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Mamak Chatswood',
      url: 'https://www.mamak.com.au/#chatswood',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Mamak Parramatta',
      url: 'https://www.mamak.com.au/#parramatta',
      suburb: 'Parramatta',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Chat Thai Haymarket',
      url: 'https://chatthai.com/locations/',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Dodee Paidang Haymarket',
      url: 'https://www.dodeepaidang.com/',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: "King's Hot Bread Hurstville",
      url: 'https://au.sluurpy.com/hurstville/restaurant/4568197/kings-hot-bread',
      suburb: 'Hurstville',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Medan Ciak Sydney CBD',
      url: 'https://medanciak.com.au/#sydney-cbd',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Medan Ciak Mascot',
      url: 'https://medanciak.com.au/#mascot',
      suburb: 'Mascot',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Pandawa Nasi Bungkus Sydney',
      url: 'https://www.pandawa.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Warung Pojok Sussex Street',
      url: 'https://tasteofindonesia.com.au/business/warung-pojok-sussex-st-6814d2965f349',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Warung Pojok Campsie',
      url: 'https://www.ubereats.com/au/store/warung-pojok/g0SkPMeoR4SHums1TlHq9A',
      suburb: 'Campsie',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Ria Ayam Penyet Sydney CBD',
      url: 'https://sydney.ria98.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Teras Java Mascot',
      url: 'https://terasjava.com.au/',
      suburb: 'Mascot',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Warung The Sawah Sydney',
      url: 'https://www.ubereats.com/au/store/warung-the-sawah/m5-9f_XmXNW0D6jv4G00gQ',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Ayam Goreng 99 Kingsford',
      url: 'https://www.ayamgoreng99.com/',
      suburb: 'Kingsford',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Aroma of Indonesia Sydney',
      url: 'https://aromaofindonesia.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Billu Indian Eatery Harris Park',
      url: 'https://www.billu.com.au/',
      suburb: 'Harris Park',
      city: 'Sydney',
      catalogs: ['https://www.billu.com.au/whats-on'],
    },
    {
      name: 'Chatkazz Harris Park',
      url: 'https://www.chatkazz.com.au/contact',
      suburb: 'Harris Park',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'The Dosa Hub Sydney CBD',
      url: 'https://www.dosahub.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Flyover Redfern',
      url: 'https://www.flyoverfritterie.com.au/',
      suburb: 'Redfern',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Pista House Sydney',
      url: 'https://pistahousesydney.com.au/',
      suburb: 'Lakemba',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Kowloon Cafe Haymarket',
      url: 'https://www.kowlooncafe.com.au/#haymarket',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Kowloon Cafe Burwood',
      url: 'https://www.kowlooncafe.com.au/#burwood',
      suburb: 'Burwood',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Kowloon Cafe Eastwood',
      url: 'https://www.kowlooncafe.com.au/#eastwood',
      suburb: 'Eastwood',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Kowloon Cafe Chatswood',
      url: 'https://www.kowlooncafe.com.au/#chatswood',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Hong Kong Street Food Rhodes',
      url: 'http://hongkongstreetfood.au/',
      suburb: 'Rhodes',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Canton Cafe Chatswood',
      url: 'https://www.chatswoodinterchange.com/eats/canton-cafe/',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Tea Square Cafe Chatswood',
      url: 'https://www.ubereats.com/au/store/tea-square-cafe/tF05r5lTUt6pusqBH7O7oA',
      suburb: 'Chatswood',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Momocha Strathfield',
      url: 'https://momocha.com.au/',
      suburb: 'Strathfield',
      city: 'Sydney',
      catalogs: ['https://momocha.com.au/about-us/'],
    },
    {
      name: 'Momo Eats Rockdale',
      url: 'https://momoeats.com.au/',
      suburb: 'Rockdale',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Chulho Town Hall',
      url: 'https://www.chulho.com.au/#town-hall',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Chulho Harris Park',
      url: 'https://www.chulho.com.au/#harris-park',
      suburb: 'Harris Park',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'The Muglan Sydney CBD',
      url: 'https://themuglan.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Namaste Sydney',
      url: 'https://namastesydney.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'MR Hotdog Cabramatta',
      url: 'https://www.mrhotdog.com.au/#cabramatta',
      suburb: 'Cabramatta',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'MR Hotdog Chinatown',
      url: 'https://www.mrhotdog.com.au/#chinatown',
      suburb: 'Haymarket',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Mr Lei Mascot',
      url: 'https://www.mrlei.com.au/',
      suburb: 'Mascot',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Shiso Fine Japanese Food Truck',
      url: 'https://shisofine.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: "Marko's Thai Street Food",
      url: 'https://markorestaurant.com.au/',
      suburb: 'Sydney',
      city: 'Sydney',
      catalogs: [],
    },
    {
      name: 'Pondok Nasi Bakar South Melbourne',
      url: 'https://pondoknasibakar.com.au/',
      suburb: 'South Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Garam Merica Melbourne',
      url: 'http://garammerica.com/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Dosa Hut Melbourne CBD',
      url: 'https://www.dosahut.net.au/#melbourne-cbd',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Momo Central Melbourne',
      url: 'https://momocentral.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Mad Momos Glenroy',
      url: 'https://madmomos.com.au/',
      suburb: 'Glenroy',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Momo Station Melbourne',
      url: 'https://momostation.com.au/',
      suburb: 'Melbourne',
      city: 'Melbourne',
      catalogs: [],
    },
    {
      name: 'Manise Cafe Perth',
      url: 'https://manisecafe.yolasite.com/',
      suburb: 'Northbridge',
      city: 'Perth',
      catalogs: [],
    },
    {
      name: 'Raja Gurih Perth',
      url: 'https://rajagurih.com.au/',
      suburb: 'Perth',
      city: 'Perth',
      catalogs: [],
    },
    {
      name: 'Sauma Northbridge',
      url: 'https://www.sauma.com.au/',
      suburb: 'Northbridge',
      city: 'Perth',
      catalogs: [],
    },
    {
      name: 'Vividh Perth',
      url: 'https://vividhrestaurant.com.au/',
      suburb: 'Perth',
      city: 'Perth',
      catalogs: [],
    },
    {
      name: 'Tasty Momo Dianella',
      url: 'https://tastymomo.com.au/',
      suburb: 'Dianella',
      city: 'Perth',
      catalogs: [],
    },
    {
      name: 'Sendok Garpu Brisbane CBD',
      url: 'https://www.sendokgarpu.com.au/',
      suburb: 'Brisbane City',
      city: 'Brisbane',
      catalogs: [],
    },
    {
      name: 'Warisan Fortitude Valley',
      url: 'https://www.warisan.com.au/',
      suburb: 'Fortitude Valley',
      city: 'Brisbane',
      catalogs: [],
    },
    {
      name: 'Chatori Cafe Brisbane',
      url: 'https://www.chatori.com.au/',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: [],
    },
    {
      name: 'Amritsar Sweets & Chaat Brisbane',
      url: 'https://amritsarfoods.com/',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: [],
    },
    {
      name: 'Spicy Momo House Lutwyche',
      url: 'https://spicymomohouse.com/',
      suburb: 'Lutwyche',
      city: 'Brisbane',
      catalogs: [],
    },
    {
      name: 'Saffron Cuisine Brisbane Street Food',
      url: 'https://saffroncuisine.com.au/menu/street-food-brisbane',
      suburb: 'Brisbane',
      city: 'Brisbane',
      catalogs: [],
    },
    {
      name: 'Stanley Brisbane Takeaway',
      url: 'https://www.stanleyrestaurant.com.au/takeaway',
      suburb: 'Brisbane City',
      city: 'Brisbane',
      catalogs: [],
    },
    {
      name: 'Ria Ayam Penyet Adelaide CBD',
      url: 'https://adelaide.ria98.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: 'Hut & Soul Adelaide',
      url: 'https://www.hutandsoul.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: 'Warung Suka Adelaide',
      url: 'https://warung-suka-indonesia-eatery.res-menu.net/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: 'Abang Abang Adelaide',
      url: 'https://www.abangabangau.com/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: 'Chaioz North Adelaide',
      url: 'https://www.chaioz.com.au/',
      suburb: 'North Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: 'The Omnii Adelaide',
      url: 'https://theomnii.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: '+82 Pocha Adelaide',
      url: 'https://plus82pocha.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: 'Sit Lo Adelaide',
      url: 'https://sitlo.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: 'Que Huong Cafe Adelaide',
      url: 'https://que-huong-cafe.com.au/',
      suburb: 'Adelaide',
      city: 'Adelaide',
      catalogs: [],
    },
    {
      name: 'Ayuriz Cafe Darwin',
      url: 'https://ayuriz-cafe.goto-restaurants.com/',
      suburb: 'Darwin City',
      city: 'Darwin',
      catalogs: [],
    },
    {
      name: 'Barrabanhmi Darwin',
      url: 'https://www.casuarinasquare.com.au/store/barrabanhmi-darwin/',
      suburb: 'Casuarina',
      city: 'Darwin',
      catalogs: [],
    },
    {
      name: 'BBQ Lady Darwin',
      url: 'https://www.bbqlady.com.au/',
      suburb: 'Darwin City',
      city: 'Darwin',
      catalogs: [],
    },
    {
      name: 'Mo:Mo King Darwin',
      url: 'https://themomoking.com.au/',
      suburb: 'Darwin City',
      city: 'Darwin',
      catalogs: [],
    },
    {
      name: 'Palates of India Darwin',
      url: 'https://palatesofindia.com/',
      suburb: 'Darwin City',
      city: 'Darwin',
      catalogs: [],
    },
    {
      name: "Lazy Susan's Eating House Darwin",
      url: 'https://www.lazysusansdarwin.com.au/',
      suburb: 'Darwin City',
      city: 'Darwin',
      catalogs: [],
    },
  ];

  await Promise.all(
    streetFoodTakeawayStores.map((store) =>
      prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: streetFoodTakeawayCategory.id,
        },
        create: {
          name: store.name,
          suburb: store.suburb,
          city: store.city,
          country: 'Australia',
          catalogs: store.catalogs,
          categoryId: streetFoodTakeawayCategory.id,
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
