const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monthlyCleanup() {
  try {
    console.log('🔄 Starting monthly database cleanup...');
    
    // Get the first day of the previous month
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth.getTime() - 1);
    
    console.log(`📅 Cleaning up discounts that expired before: ${lastDayOfPreviousMonth.toISOString()}`);
    
    // Delete expired discounts from the previous month
    const deletedDiscounts = await prisma.discount.deleteMany({
      where: {
        endDate: {
          lt: firstDayOfCurrentMonth
        }
      }
    });
    
    console.log(`✅ Deleted ${deletedDiscounts.count} expired discounts`);
    
    // Find stores that have no active discounts and delete them
    const storesWithNoDiscounts = await prisma.store.findMany({
      where: {
        discounts: {
          none: {}
        }
      }
    });
    
    if (storesWithNoDiscounts.length > 0) {
      const deletedStores = await prisma.store.deleteMany({
        where: {
          discounts: {
            none: {}
          }
        }
      });
      
      console.log(`✅ Deleted ${deletedStores.count} stores with no active discounts`);
    } else {
      console.log('ℹ️  No stores found without active discounts');
    }
    
    // Get summary statistics
    const totalStores = await prisma.store.count();
    const totalDiscounts = await prisma.discount.count();
    const activeDiscounts = await prisma.discount.count({
      where: {
        endDate: {
          gte: new Date()
        }
      }
    });
    
    console.log('\n📊 Database Summary:');
    console.log(`   Total Stores: ${totalStores}`);
    console.log(`   Total Discounts: ${totalDiscounts}`);
    console.log(`   Active Discounts: ${activeDiscounts}`);
    console.log(`   Expired Discounts: ${totalDiscounts - activeDiscounts}`);
    
    console.log('\n✅ Monthly cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during monthly cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
monthlyCleanup(); 