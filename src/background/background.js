// Background Service Worker (MV3)
// Handles Supabase sync and message routing from content scripts

// Set up global window object for imported scripts
if (typeof window === 'undefined') {
    globalThis.window = globalThis;
}

console.log('[Background] Importing scripts...');

// Import scripts using importScripts for compatibility
importScripts('../content/feature-column-mapper.js');
importScripts('./supabase-sync.js');

console.log('[Background] ✅ Background service worker initialized');
console.log('[Background] FeatureColumnMapper available?', !!window.FeatureColumnMapper);
console.log('[Background] SupabaseSync available?', !!window.SupabaseSync);
