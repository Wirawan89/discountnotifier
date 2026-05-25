const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const pruneEmptyStores = args.includes('--prune-empty-stores');

async function monthlyCleanup() {
  try {
    console.log('🔄 Starting expired discount cleanup...');
    
    const now = new Date();
    console.log(`📅 Removing discounts with endDate before: ${now.toISOString()}`);
    console.log(`🔎 Mode: ${isDryRun ? 'dry run' : 'delete expired discounts'}`);

    const expiredDiscounts = await prisma.discount.findMany({
      where: {
        endDate: {
          lt: now
        }
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 Found ${expiredDiscounts.length} expired discounts`);

    if (expiredDiscounts.length > 0) {
      expiredDiscounts.slice(0, 10).forEach((discount) => {
        console.log(`   • ${discount.store.name}: ${discount.title} (ended ${discount.endDate.toISOString()})`);
      });

      if (expiredDiscounts.length > 10) {
        console.log(`   • ...and ${expiredDiscounts.length - 10} more`);
      }
    }

    if (!isDryRun && expiredDiscounts.length > 0) {
      const deletedDiscounts = await prisma.discount.deleteMany({
        where: {
          endDate: {
            lt: now
          }
        }
      });

      console.log(`✅ Deleted ${deletedDiscounts.count} expired discounts`);
    } else if (isDryRun) {
      console.log('ℹ️  Dry run complete. No discounts were deleted.');
    } else {
      console.log('✅ No expired discounts found. Current Offers are already clean.');
    }

    if (!isDryRun && pruneEmptyStores) {
      const deletedStores = await prisma.store.deleteMany({
        where: {
          discounts: {
            none: {}
          }
        }
      });

      console.log(`✅ Deleted ${deletedStores.count} stores with no active discounts`);
    } else if (!pruneEmptyStores) {
      console.log('ℹ️  Empty stores were kept. Pass --prune-empty-stores to delete stores with no discounts.');
    }
    
    const totalStores = await prisma.store.count();
    const totalDiscounts = await prisma.discount.count();
    const activeDiscounts = await prisma.discount.count({
      where: {
        endDate: {
          gte: now
        }
      }
    });
    
    console.log('\n📊 Database Summary:');
    console.log(`   Total Stores: ${totalStores}`);
    console.log(`   Total Discounts: ${totalDiscounts}`);
    console.log(`   Active Discounts: ${activeDiscounts}`);
    console.log(`   Expired Discounts: ${totalDiscounts - activeDiscounts}`);
    
    console.log('\n✅ Expired discount cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during expired discount cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
monthlyCleanup();
