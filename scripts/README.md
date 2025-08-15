# Database Maintenance Scripts

This directory contains scripts for maintaining the DiscountNotifier database.

## Available Scripts

### 1. Monthly Cleanup (`monthly-cleanup.js`)
**Purpose**: Automatically removes expired discounts and orphaned stores on the first day of each month.

**What it does**:
- Removes all discounts that expired in the previous month
- Removes stores that have no active discounts
- Provides a summary of remaining data

**Usage**:
```bash
npm run cleanup:monthly
```

### 2. Expired Discounts Cleanup (`cleanup-expired.js`)
**Purpose**: Removes all currently expired discounts.

**Usage**:
```bash
npm run cleanup
```

### 3. Full Database Cleanup (`cleanup-database.js`)
**Purpose**: Comprehensive cleanup of expired discounts and orphaned stores.

**Usage**:
```bash
npm run cleanup:full
```

### 4. Testing Data Cleanup (`cleanup-testing.js`)
**Purpose**: Removes stores with "TESTING" in their names.

**Usage**:
```bash
npm run cleanup:testing
```

### 5. Cron Setup (`setup-cron.js`)
**Purpose**: Helps set up automatic monthly cleanup via cron jobs.

**Usage**:
```bash
npm run setup:cron
```

## Setting Up Automatic Monthly Cleanup

### Option 1: Using the Setup Script
1. Run the setup script:
   ```bash
   npm run setup:cron
   ```
2. Follow the instructions provided by the script

### Option 2: Manual Cron Setup
1. Open your crontab:
   ```bash
   crontab -e
   ```
2. Add this line (replace `/path/to/project` with your actual project path):
   ```
   0 2 1 * * cd /path/to/project && npm run cleanup:monthly >> logs/monthly-cleanup.log 2>&1
   ```
3. Save and exit

### Cron Schedule Explanation
- `0 2 1 * *` = Run at 2:00 AM on the 1st day of every month
- The script will:
  - Remove discounts that expired in the previous month
  - Remove stores with no active discounts
  - Log results to `logs/monthly-cleanup.log`

## Logs
All cleanup operations are logged to the `logs/` directory:
- `monthly-cleanup.log` - Monthly cleanup results
- Other cleanup scripts output to console

## Testing
Before setting up automatic cleanup, test the scripts manually:
```bash
# Test monthly cleanup
npm run cleanup:monthly

# Test expired cleanup
npm run cleanup

# Test full cleanup (be careful!)
npm run cleanup:full
```

## Safety Features
- All scripts provide detailed logging
- Monthly cleanup only removes discounts from the previous month
- Scripts show summary statistics after cleanup
- Error handling prevents partial cleanups 