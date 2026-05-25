# Database Maintenance Scripts

This directory contains scripts for maintaining the DiscountNotifier database.

## Available Scripts

### 1. Expired Offer Cleanup (`monthly-cleanup.js`)
**Purpose**: Automatically removes expired discounts by checking each discount's `endDate`.

**What it does**:
- Removes discounts where `endDate` is before the current time
- Keeps stores by default
- Optionally removes stores that have no discounts when run with `--prune-empty-stores`
- Provides a summary of remaining data

**Usage**:
```bash
npm run cleanup:monthly
npm run cleanup:monthly:dry-run
npm run cleanup:monthly -- --prune-empty-stores
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
**Purpose**: Helps set up automatic expired-offer cleanup via cron jobs.

**Usage**:
```bash
npm run setup:cron
```

## Automatic Current Offers Cleanup

The Current Offers list also cleans itself when the app calls `/api/discounts`. Expired discounts are deleted before offers are returned, so users should not see expired offers even if the scheduled cleanup has not run yet.

## Setting Up Automatic Scheduled Cleanup

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
   0 2 * * * cd /path/to/project && npm run cleanup:monthly >> logs/monthly-cleanup.log 2>&1
   ```
3. Save and exit

### Cron Schedule Explanation
- `0 2 * * *` = Run every day at 2:00 AM
- The script will:
  - Remove discounts where `endDate` has already passed
  - Keep stores unless `--prune-empty-stores` is passed
  - Log results to `logs/monthly-cleanup.log`

## Logs
All cleanup operations are logged to the `logs/` directory:
- `monthly-cleanup.log` - Monthly cleanup results
- Other cleanup scripts output to console

## Testing
Before setting up automatic cleanup, test the scripts manually:
```bash
# Preview expired offer cleanup
npm run cleanup:monthly:dry-run

# Run expired offer cleanup
npm run cleanup:monthly

# Test expired cleanup
npm run cleanup

# Test full cleanup (be careful!)
npm run cleanup:full
```

## Safety Features
- All scripts provide detailed logging
- Expired offer cleanup supports `--dry-run`
- Empty stores are kept unless `--prune-empty-stores` is passed
- Scripts show summary statistics after cleanup
- Error handling prevents partial cleanups 
