const path = require('path');
const fs = require('fs');

console.log('🔄 Setting up DiscountNotifier scheduled maintenance...');

// Get the absolute path to the project directory
const projectDir = path.resolve(__dirname, '..');
const scriptPath = path.join(projectDir, 'scripts', 'monthly-cleanup.js');
const schedulerPath = path.join(projectDir, 'scripts', 'run-scheduled-admin-tasks.ts');

// Check if the script exists
if (!fs.existsSync(scriptPath)) {
  console.error('❌ Monthly cleanup script not found!');
  process.exit(1);
}

if (!fs.existsSync(schedulerPath)) {
  console.error('❌ Admin scheduler runner script not found!');
  process.exit(1);
}

// Run daily so expired offers are removed shortly after their end date passes.
const cronCommand = `0 2 * * * cd ${projectDir} && npm run cleanup:monthly >> ${path.join(projectDir, 'logs', 'monthly-cleanup.log')} 2>&1`;
const adminSchedulerCronCommand = `*/15 * * * * cd ${projectDir} && npm run admin:run-due >> ${path.join(projectDir, 'logs', 'admin-scheduler.log')} 2>&1`;

console.log('\n📋 Cron job commands to add:');
console.log('=====================================');
console.log(cronCommand);
console.log(adminSchedulerCronCommand);
console.log('=====================================');

console.log('\n📝 Instructions:');
console.log('1. Open your terminal and run: crontab -e');
console.log('2. Add the above command to the file');
console.log('3. Save and exit (usually Ctrl+X, then Y, then Enter)');
console.log('4. Verify with: crontab -l');

console.log('\n⏰ This will run cleanup every day at 2:00 AM and check enabled admin scheduler tasks every 15 minutes');

// Create logs directory if it doesn't exist
const logsDir = path.join(projectDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('\n✅ Created logs directory');
}

console.log('\n🔧 Alternative: Test the cleanup manually with:');
console.log(`   npm run cleanup:monthly:dry-run`);
console.log('\n🔧 Test enabled admin scheduler tasks manually with:');
console.log('   npm run admin:run-due');

console.log('\n📊 The cleanup will:');
console.log('   • Remove discounts where endDate has already passed');
console.log('   • Keep stores by default');
console.log('   • Optionally remove empty stores with: npm run cleanup:monthly -- --prune-empty-stores');
console.log('   • Run enabled admin tasks when their Next run time is due');
console.log('   • Location Enrichment refreshes branch locations and then runs offer verification'); 
