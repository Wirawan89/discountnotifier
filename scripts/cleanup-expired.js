const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupExpiredDiscounts() {
  try {
    console.log('🔍 Starting cleanup of expired discounts...');
    
    // Get current date
    const currentDate = new Date();
    console.log(`📅 Current date: ${currentDate.toISOString()}`);
    
    // Find all expired discounts
    const expiredDiscounts = await prisma.discount.findMany({
      where: {
        endDate: {
          lt: currentDate
        }
      },
      include: {
        store: true
      }
    });
    
    console.log(`📊 Found ${expiredDiscounts.length} expired discounts`);
    
    if (expiredDiscounts.length === 0) {
      console.log('✅ No expired discounts found. Database is clean!');
      return;
    }
    
    // Group expired discounts by store
    const storeDiscountMap = new Map();
    expiredDiscounts.forEach(discount => {
      const storeId = discount.storeId;
      if (!storeDiscountMap.has(storeId)) {
        storeDiscountMap.set(storeId, []);
      }
      storeDiscountMap.get(storeId).push(discount);
    });
    
    console.log(`🏪 Affected stores: ${storeDiscountMap.size}`);
    
    // Delete expired discounts
    const deletedDiscounts = await prisma.discount.deleteMany({
      where: {
        endDate: {
          lt: currentDate
        }
      }
    });
    
    console.log(`🗑️  Deleted ${deletedDiscounts.count} expired discounts`);
    
    // Check which stores now have no active discounts
    const storesToCheck = Array.from(storeDiscountMap.keys());
    const storesToDelete = [];
    
    for (const storeId of storesToCheck) {
      const activeDiscounts = await prisma.discount.findMany({
        where: {
          storeId: storeId,
          endDate: {
            gte: currentDate
          }
        }
      });
      
      if (activeDiscounts.length === 0) {
        storesToDelete.push(storeId);
      }
    }
    
    console.log(`🏪 Stores with no active discounts: ${storesToDelete.length}`);
    
    // Delete stores that have no active discounts
    if (storesToDelete.length > 0) {
      const deletedStores = await prisma.store.deleteMany({
        where: {
          id: {
            in: storesToDelete
          }
        }
      });
      
      console.log(`🗑️  Deleted ${deletedStores.count} stores with no active discounts`);
    }
    
    // Show summary
    const remainingDiscounts = await prisma.discount.count();
    const remainingStores = await prisma.store.count();
    
    console.log('\n📈 Cleanup Summary:');
    console.log(`✅ Remaining active discounts: ${remainingDiscounts}`);
    console.log(`✅ Remaining stores: ${remainingStores}`);
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupExpiredDiscounts(); 