-- Migration: Enable Row Level Security on all tables
-- Run this in your Supabase SQL editor
--
-- LEVEL 1: Enable RLS, allow anon full access (no code changes)
-- LEVEL 2: Secret header via Supabase Vault (requires extension code change)
--
-- Run Level 1 first. If you want real protection, continue with Level 2.
-- ─────────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════
-- LEVEL 1: Enable RLS + allow anon role full access
-- No code changes needed. Removes UNRESTRICTED badge.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE car_data          ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_features      ENABLE ROW LEVEL SECURITY;
ALTER TABLE features_config   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON car_data
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all" ON car_features
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all" ON features_config
    FOR ALL TO anon USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- LEVEL 2: Secret header via Supabase Vault  (OPTIONAL)
-- ══════════════════════════════════════════════════════════════
-- Uses Supabase's built-in encrypted Vault (no ALTER DATABASE needed).
-- Every request must include the header:  x-api-secret: <your-secret>
--
-- STEPS:
-- 1. Generate a secret, e.g.:  openssl rand -hex 32
-- 2. Replace 'REPLACE_WITH_YOUR_SECRET' in the vault.create_secret call below
-- 3. Run all of LEVEL 2 in the SQL editor (after Level 1 already ran)
-- 4. Store the same secret in extension Options page as "API Secret"
--    (requires a small Options + supabase-client.js code change — see below)
-- ─────────────────────────────────────────────────────────────────────────────────

-- 2a. Store secret in Vault (run once; re-run is safe — it uses INSERT ... ON CONFLICT)
/*
INSERT INTO vault.secrets (secret, name, description)
VALUES (
    'REPLACE_WITH_YOUR_SECRET',
    'car_notes_api_secret',
    'Header secret for Car Notes Chrome extension'
)
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;
*/

-- 2b. Replace Level-1 policies with secret-aware ones
/*
DROP POLICY IF EXISTS "anon_all" ON car_data;
DROP POLICY IF EXISTS "anon_all" ON car_features;
DROP POLICY IF EXISTS "anon_all" ON features_config;

CREATE POLICY "secret_access" ON car_data
    FOR ALL TO anon
    USING (
        current_setting('request.headers', true)::json->>'x-api-secret'
        = (SELECT decrypted_secret FROM vault.decrypted_secrets
           WHERE name = 'car_notes_api_secret' LIMIT 1)
    )
    WITH CHECK (
        current_setting('request.headers', true)::json->>'x-api-secret'
        = (SELECT decrypted_secret FROM vault.decrypted_secrets
           WHERE name = 'car_notes_api_secret' LIMIT 1)
    );

CREATE POLICY "secret_access" ON car_features
    FOR ALL TO anon
    USING (
        current_setting('request.headers', true)::json->>'x-api-secret'
        = (SELECT decrypted_secret FROM vault.decrypted_secrets
           WHERE name = 'car_notes_api_secret' LIMIT 1)
    )
    WITH CHECK (
        current_setting('request.headers', true)::json->>'x-api-secret'
        = (SELECT decrypted_secret FROM vault.decrypted_secrets
           WHERE name = 'car_notes_api_secret' LIMIT 1)
    );

CREATE POLICY "secret_access" ON features_config
    FOR ALL TO anon
    USING (
        current_setting('request.headers', true)::json->>'x-api-secret'
        = (SELECT decrypted_secret FROM vault.decrypted_secrets
           WHERE name = 'car_notes_api_secret' LIMIT 1)
    )
    WITH CHECK (
        current_setting('request.headers', true)::json->>'x-api-secret'
        = (SELECT decrypted_secret FROM vault.decrypted_secrets
           WHERE name = 'car_notes_api_secret' LIMIT 1)
    );
*/

-- 2c. Extension changes needed (supabase-client.js):
--   - Load 'apiSecret' from chrome.storage.sync alongside supabaseUrl/supabaseKey
--   - Add  'x-api-secret': this.secret  to the headers of EVERY fetch() call
--   - Add an "API Secret" field to options.html + save it in options.js


-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('car_data', 'car_features', 'features_config')
ORDER BY tablename;

SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('car_data', 'car_features', 'features_config')
ORDER BY tablename, policyname;
