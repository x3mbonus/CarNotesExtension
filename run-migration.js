#!/usr/bin/env node

/**
 * Migration Runner - Execute MIGRATION_FRESH_SCHEMA.sql on specified environment
 *
 * Usage:
 *   node run-migration.js --environment=dev
 *   node run-migration.js --environment=production
 *   node run-migration.js --env=dev --dry-run    # Preview only
 *
 * Environment Configuration:
 *   - Reads from migration-config.json
 *   - Requires SUPABASE_SERVICE_ROLE_KEY env variable for authentication
 *   - Production requires additional confirmation
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse command line arguments
const args = process.argv.slice(2);
let environment = 'dev';
let dryRun = false;

args.forEach(arg => {
  if (arg.startsWith('--environment=') || arg.startsWith('--env=')) {
    environment = arg.split('=')[1];
  }
  if (arg === '--dry-run') {
    dryRun = true;
  }
});

// Load configuration
const configPath = path.join(__dirname, 'migration-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ Error: migration-config.json not found');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

if (!config.environments[environment]) {
  console.error(`❌ Error: Environment "${environment}" not found in migration-config.json`);
  console.error(`Available environments: ${Object.keys(config.environments).join(', ')}`);
  process.exit(1);
}

const envConfig = config.environments[environment];

// Load migration SQL
const migrationPath = path.join(__dirname, config.migration.file);
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Error: ${config.migration.file} not found`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

// Main execution
async function runMigration() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Car Notes Extension - Database Migration');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`🎯 Environment: ${envConfig.name} (${environment})`);
  console.log(`📝 Migration: ${config.migration.name} v${config.migration.version}`);
  console.log(`📄 File: ${config.migration.file}\n`);

  if (envConfig.requiresConfirmation) {
    console.log('⚠️  WARNING: PRODUCTION ENVIRONMENT');
    if (envConfig.backupBeforeMigration) {
      console.log('   ✓ Backup required before migration\n');
    }
  }

  // Get credentials
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
    console.error('\nSet it with:');
    if (process.platform === 'win32') {
      console.error('   $env:SUPABASE_SERVICE_ROLE_KEY = "your-key"');
    } else {
      console.error('   export SUPABASE_SERVICE_ROLE_KEY=your-key');
    }
    process.exit(1);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN - Preview only (no changes made)\n');
    console.log('SQL to be executed:');
    console.log('─────────────────────────────────────────────────────');
    console.log(migrationSQL.substring(0, 500) + '...\n');
    return;
  }

  // Confirm production migration
  if (envConfig.requiresConfirmation) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('⚠️  This will modify your PRODUCTION database.');
    console.log('   Tables: ' + config.migration.backupTables.join(', '));
    console.log('   Make sure to backup first!\n');

    rl.question('Type "yes, migrate" to proceed: ', (answer) => {
      rl.close();
      if (answer !== 'yes, migrate') {
        console.log('❌ Migration cancelled');
        process.exit(0);
      }
      executeMigration(serviceRoleKey, envConfig);
    });
  } else {
    executeMigration(serviceRoleKey, envConfig);
  }
}

async function executemigration(serviceRoleKey, envConfig) {
  try {
    const supabase = createClient(envConfig.supabaseUrl, serviceRoleKey);

    console.log('🚀 Connecting to Supabase...');
    // Test connection
    const { data, error } = await supabase.from('car_data_local').select('count').limit(0);
    if (error) throw error;

    console.log('✓ Connected successfully\n');

    console.log('▶️  Executing migration...\n');
    // Execute migration - split by statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`  ▸ ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec', { sql_query: statement });
      if (error) {
        console.error(`    ❌ Error: ${error.message}`);
        throw error;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`   Environment: ${envConfig.name} (${environment})`);
    console.log(`   Tables affected: ${config.migration.backupTables.join(', ')}`);

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('   ' + error.message);
    process.exit(1);
  }
}

// Run migration
runMigration();
