# Supabase Integration Setup

## 1. Create Supabase Table

Go to [supabase.com](https://supabase.com) and create a new project.

In the SQL editor, run this:

```sql
CREATE TABLE car_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id TEXT NOT NULL,
  text TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  sync_hash TEXT,
  UNIQUE(car_id)
);

-- Enable RLS for public read/write (for anonymous auth)
ALTER TABLE car_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON car_notes
  FOR SELECT USING (true);

CREATE POLICY "Allow public write" ON car_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON car_notes
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete" ON car_notes
  FOR DELETE USING (true);
```

## 2. Get Your Credentials

1. Go to **Settings → API** in your Supabase project
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (under "API keys")

## 3. Configure Extension

The first time you use the extension, it will ask you to enter your Supabase credentials once. They will be stored securely in Chrome extension storage.

Click the extension icon → Settings (or first time prompt) → Enter:
- Supabase Project URL
- Supabase Anon Key

## 4. Auto-Sync

Notes will automatically sync to Supabase when:
- You save a note
- You delete a note
- You import notes
- The extension starts up (if online)

Local storage is always used as a fallback.

## 5. Transfer to Different Chrome Account

Your Supabase project is independent. When you use the extension on a different Chrome account:

1. Same Supabase credentials available from your account
2. Copy them into the new account's extension settings
3. Notes will sync automatically

**No export/import needed!**
