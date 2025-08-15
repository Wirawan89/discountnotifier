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
      where: { id: 1 },
      update: {},
      create: {
        name: 'Marketpal.ai',
        suburb: 'Sydney',
        categoryId: categories[20].id,
        url: 'https://marketpal.ai',
        ownerId: user.id,
      },
    }),
    prisma.store.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Wirawan Bakery-Testing',
        suburb: 'Melbourne',
        categoryId: categories[25].id,
        url: 'https://wirawanbakery.com',
        ownerId: user.id,
      },
    }),
    prisma.store.upsert({
        where: { id: 3 },
        update: {},
        create: {
          name: 'Wirawan Bars-Testing',
          suburb: 'Sydney',
          categoryId: categories[3].id,
          url: 'https://wirawanbars.com',
          ownerId: user.id,
        },
      }),
      prisma.store.upsert({
        where: { id: 4 },
        update: {},
        create: {
          name: 'WB Departement Store-Testing',
          suburb: 'Sydney',
          categoryId: categories[10].id,
          url: 'https://wbdepartementstore.com',
          ownerId: user.id,
        },
      }),
  ]);

  // Create some test discounts
  await Promise.all([
    prisma.discount.upsert({
      where: { id: 1 },
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
      where: { id: 2 },
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
        where: { id: 3 },
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
        where: { id: 4 },
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
        where: { id: 5 },
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