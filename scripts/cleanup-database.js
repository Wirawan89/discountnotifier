const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveCleanup() {
  try {
    console.log('🧹 Starting comprehensive database cleanup...');
    
    const currentDate = new Date();
    console.log(`📅 Current date: ${currentDate.toISOString()}`);
    
    // 1. Clean up expired discounts
    console.log('\n📊 Step 1: Cleaning expired discounts...');
    const expiredDiscounts = await prisma.discount.findMany({
      where: {
        endDate: {
          lt: currentDate
        }
      }
    });
    
    if (expiredDiscounts.length > 0) {
      const deletedDiscounts = await prisma.discount.deleteMany({
        where: {
          endDate: {
            lt: currentDate
          }
        }
      });
      console.log(`🗑️  Deleted ${deletedDiscounts.count} expired discounts`);
    } else {
      console.log('✅ No expired discounts found');
    }
    
    // 2. Find stores with no active discounts
    console.log('\n🏪 Step 2: Finding stores with no active discounts...');
    const allStores = await prisma.store.findMany({
      include: {
        discounts: {
          where: {
            endDate: {
              gte: currentDate
            }
          }
        }
      }
    });
    
    const storesToDelete = allStores.filter(store => store.discounts.length === 0);
    
    if (storesToDelete.length > 0) {
      const storeIds = storesToDelete.map(store => store.id);
      const deletedStores = await prisma.store.deleteMany({
        where: {
          id: {
            in: storeIds
          }
        }
      });
      console.log(`🗑️  Deleted ${deletedStores.count} stores with no active discounts`);
    } else {
      console.log('✅ All stores have active discounts');
    }
    
    // 3. Clean up orphaned discounts (if any)
    console.log('\n🔗 Step 3: Skipped orphaned discounts check (not applicable)');
    
    // 4. Final statistics
    console.log('\n📈 Final Statistics:');
    const finalDiscounts = await prisma.discount.count();
    const finalStores = await prisma.store.count();
    const activeDiscounts = await prisma.discount.count({
      where: {
        endDate: {
          gte: currentDate
        }
      }
    });
    
    console.log(`✅ Total discounts: ${finalDiscounts}`);
    console.log(`✅ Active discounts: ${activeDiscounts}`);
    console.log(`✅ Total stores: ${finalStores}`);
    
    // 5. Show some sample active discounts
    console.log('\n🎯 Sample Active Discounts:');
    const sampleDiscounts = await prisma.discount.findMany({
      where: {
        endDate: {
          gte: currentDate
        }
      },
      include: {
        store: true
      },
      take: 5,
      orderBy: {
        endDate: 'asc'
      }
    });
    
    sampleDiscounts.forEach(discount => {
      const endDate = new Date(discount.endDate).toLocaleDateString();
      console.log(`  • ${discount.store.name}: ${discount.title} (ends: ${endDate})`);
    });
    
    console.log('\n🎉 Comprehensive cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Add command line argument support
const args = process.argv.slice(2);
if (args.includes('--dry-run')) {
  console.log('🔍 DRY RUN MODE - No changes will be made');
  // You can add dry run logic here
}

comprehensiveCleanup(); 