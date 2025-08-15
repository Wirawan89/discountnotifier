const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTestingStores() {
  try {
    console.log('🧹 Starting cleanup of testing stores (case-insensitive)...');
    
    // Find all testing stores that match the pattern (case-insensitive)
    const testingStores = await prisma.store.findMany({
      where: {
        OR: [
          {
            name: {
              startsWith: 'WIRAWAN',
              mode: 'insensitive',
              contains: '-TESTING',
              mode: 'insensitive',
            }
          },
          {
            name: {
              startsWith: 'WB',
              mode: 'insensitive',
              contains: '-TESTING',
              mode: 'insensitive',
            }
          },
          // Also match if just contains -TESTING (for any other test stores)
          {
            name: {
              contains: '-TESTING',
              mode: 'insensitive',
            }
          }
        ]
      },
      include: {
        discounts: true
      }
    });
    
    console.log(`📊 Found ${testingStores.length} testing stores to remove:`);
    testingStores.forEach(store => {
      console.log(`  - ${store.name} (ID: ${store.id}) with ${store.discounts.length} discounts`);
    });
    
    if (testingStores.length === 0) {
      console.log('✅ No testing stores found. Database is clean!');
      return;
    }
    
    // Delete discounts first (due to foreign key constraints)
    let totalDiscountsDeleted = 0;
    for (const store of testingStores) {
      if (store.discounts.length > 0) {
        const deletedDiscounts = await prisma.discount.deleteMany({
          where: {
            storeId: store.id
          }
        });
        totalDiscountsDeleted += deletedDiscounts.count;
        console.log(`🗑️  Deleted ${deletedDiscounts.count} discounts for ${store.name}`);
      }
    }
    
    // Delete the testing stores
    const deletedStores = await prisma.store.deleteMany({
      where: {
        OR: [
          {
            name: {
              startsWith: 'WIRAWAN',
              mode: 'insensitive',
              contains: '-TESTING',
              mode: 'insensitive',
            }
          },
          {
            name: {
              startsWith: 'WB',
              mode: 'insensitive',
              contains: '-TESTING',
              mode: 'insensitive',
            }
          },
          {
            name: {
              contains: '-TESTING',
              mode: 'insensitive',
            }
          }
        ]
      }
    });
    
    console.log(`\n✅ Cleanup completed successfully!`);
    console.log(`🗑️  Deleted ${deletedStores.count} testing stores`);
    console.log(`🗑️  Deleted ${totalDiscountsDeleted} associated discounts`);
    
    // Show remaining stores count
    const remainingStores = await prisma.store.count();
    const remainingDiscounts = await prisma.discount.count();
    console.log(`\n📊 Database status after cleanup:`);
    console.log(`  - Remaining stores: ${remainingStores}`);
    console.log(`  - Remaining discounts: ${remainingDiscounts}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestingStores(); 