const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔄 Setting up automatic monthly database cleanup...');

// Get the absolute path to the project directory
const projectDir = path.resolve(__dirname, '..');
const scriptPath = path.join(projectDir, 'scripts', 'monthly-cleanup.js');

// Check if the script exists
if (!fs.existsSync(scriptPath)) {
  console.error('❌ Monthly cleanup script not found!');
  process.exit(1);
}

// Create the cron job command
const cronCommand = `0 2 1 * * cd ${projectDir} && npm run cleanup:monthly >> ${path.join(projectDir, 'logs', 'monthly-cleanup.log')} 2>&1`;

console.log('\n📋 Cron job command to add:');
console.log('=====================================');
console.log(cronCommand);
console.log('=====================================');

console.log('\n📝 Instructions:');
console.log('1. Open your terminal and run: crontab -e');
console.log('2. Add the above command to the file');
console.log('3. Save and exit (usually Ctrl+X, then Y, then Enter)');
console.log('4. Verify with: crontab -l');

console.log('\n⏰ This will run the cleanup on the 1st day of each month at 2:00 AM');

// Create logs directory if it doesn't exist
const logsDir = path.join(projectDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('\n✅ Created logs directory');
}

console.log('\n🔧 Alternative: Test the cleanup manually with:');
console.log(`   npm run cleanup:monthly`);

console.log('\n📊 The cleanup will:');
console.log('   • Remove all discounts that expired in the previous month');
console.log('   • Remove stores that have no active discounts');
console.log('   • Show a summary of remaining data'); 