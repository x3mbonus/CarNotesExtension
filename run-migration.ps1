# Migration Runner - PowerShell Helper Script
# Run migrations against different Supabase environments (dev/production)
#
# Usage:
#   .\run-migration.ps1 -Environment dev
#   .\run-migration.ps1 -Environment production -DryRun
#   .\run-migration.ps1 -Environment prod
#
# Prerequisites:
#   - Node.js and npm installed
#   - @supabase/supabase-js package installed
#   - migration-config.json configured
#   - SUPABASE_SERVICE_ROLE_KEY environment variable set

param(
    [ValidateSet('dev', 'production', 'prod')]
    [string]$Environment = 'dev',

    [switch]$DryRun,

    [switch]$Help
)

if ($Help) {
    Write-Host @"
╔════════════════════════════════════════════════════════════╗
║   Car Notes Extension - Database Migration (PowerShell)    ║
╚════════════════════════════════════════════════════════════╝

USAGE:
  .\run-migration.ps1 -Environment dev
  .\run-migration.ps1 -Environment production
  .\run-migration.ps1 -Environment prod -DryRun

ENVIRONMENTS:
  dev          Development environment (no confirmation required)
  production   Production environment (requires confirmation)
  prod         Alias for production

OPTIONS:
  -DryRun      Preview changes without executing (test mode)
  -Help        Show this help message

SETUP:
  1. Install Node.js: https://nodejs.org
  2. Install dependencies:
     npm install @supabase/supabase-js

  3. Configure migration-config.json with your Supabase credentials

  4. Set environment variable:
     `$env:SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'`

  5. Run migration:
     .\run-migration.ps1 -Environment dev

EXAMPLES:
  # Preview migration for dev
  .\run-migration.ps1 -Environment dev -DryRun

  # Run migration on development
  .\run-migration.ps1 -Environment dev

  # Run migration on production (will prompt for confirmation)
  .\run-migration.ps1 -Environment production

NOTES:
  - Always backup before running on production
  - Migration is idempotent (safe to run multiple times)
  - Use -DryRun to verify behavior first
  - Check SUPABASE_SERVICE_ROLE_KEY is set before running

"@
    exit
}

# Normalize environment name
if ($Environment -eq 'prod') {
    $Environment = 'production'
}

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║   Preparing Migration for: $($Environment.ToUpper())
╚════════════════════════════════════════════════════════════╝

"@

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if migration files exist
$configFile = Join-Path $PSScriptRoot 'migration-config.json'
$migrationFile = Join-Path $PSScriptRoot 'run-migration.js'

if (-not (Test-Path $configFile)) {
    Write-Host "  ❌ migration-config.json not found" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ✓ migration-config.json found" -ForegroundColor Green
}

if (-not (Test-Path $migrationFile)) {
    Write-Host "  ❌ run-migration.js not found" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ✓ run-migration.js found" -ForegroundColor Green
}

# Check if environment variable is set
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "  ❌ SUPABASE_SERVICE_ROLE_KEY not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set environment variable:" -ForegroundColor Yellow
    Write-Host '  $env:SUPABASE_SERVICE_ROLE_KEY = "your-key-here"' -ForegroundColor White
    Write-Host ""
    Write-Host "Then run again:" -ForegroundColor Yellow
    Write-Host "  .\run-migration.ps1 -Environment $Environment" -ForegroundColor White
    exit 1
} else {
    Write-Host "  ✓ SUPABASE_SERVICE_ROLE_KEY is set" -ForegroundColor Green
}

Write-Host ""

# Build command
$command = @(
    "node",
    $migrationFile,
    "--environment=$Environment"
)

if ($DryRun) {
    $command += "--dry-run"
    Write-Host "🔍 DRY RUN MODE (preview only, no changes)" -ForegroundColor Yellow
    Write-Host ""
}

# Run migration
Write-Host "▶️  Starting migration..." -ForegroundColor Cyan
Write-Host ""

& $command[0] @command[1..$command.Count]

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Migration failed" -ForegroundColor Red
    exit $LASTEXITCODE
}
