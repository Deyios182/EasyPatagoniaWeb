-- ============================================
-- INTRANET TABLES FOR EASY PATAGONIA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. TRANSACTIONS (Income & Expenses)
CREATE TABLE IF NOT EXISTS intranet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'general',
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT
);

-- 2. FOLDERS (Shared folder structure)
CREATE TABLE IF NOT EXISTS intranet_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES intranet_folders(id) ON DELETE CASCADE,
    folder_year INT,
    folder_month INT,
    icon TEXT DEFAULT 'folder',
    color TEXT DEFAULT '#3b82f6'
);

-- 3. FILES (Files inside folders)
CREATE TABLE IF NOT EXISTS intranet_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    folder_id UUID REFERENCES intranet_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    file_type TEXT,
    notes TEXT
);

-- 4. CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS intranet_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    all_day BOOLEAN DEFAULT FALSE,
    color TEXT DEFAULT '#6366f1',
    event_type TEXT DEFAULT 'general'
);

-- 5. BUDGET (Monthly budget per category)
CREATE TABLE IF NOT EXISTS intranet_budget (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    category TEXT NOT NULL,
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),
    year INT NOT NULL,
    budgeted_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    UNIQUE(category, month, year)
);

-- ============================================
-- RLS POLICIES (Restrict to super_admin only)
-- ============================================

ALTER TABLE intranet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intranet_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE intranet_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE intranet_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE intranet_budget ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_intranet_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND (
            roles @> '["super_admin"]'::jsonb
            OR roles @> '["admin"]'::jsonb
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transactions policies
CREATE POLICY "Intranet admins can read transactions" ON intranet_transactions
    FOR SELECT USING (is_intranet_admin());
CREATE POLICY "Intranet admins can insert transactions" ON intranet_transactions
    FOR INSERT WITH CHECK (is_intranet_admin());
CREATE POLICY "Intranet admins can update transactions" ON intranet_transactions
    FOR UPDATE USING (is_intranet_admin());
CREATE POLICY "Intranet admins can delete transactions" ON intranet_transactions
    FOR DELETE USING (is_intranet_admin());

-- Folders policies
CREATE POLICY "Intranet admins can read folders" ON intranet_folders
    FOR SELECT USING (is_intranet_admin());
CREATE POLICY "Intranet admins can insert folders" ON intranet_folders
    FOR INSERT WITH CHECK (is_intranet_admin());
CREATE POLICY "Intranet admins can update folders" ON intranet_folders
    FOR UPDATE USING (is_intranet_admin());
CREATE POLICY "Intranet admins can delete folders" ON intranet_folders
    FOR DELETE USING (is_intranet_admin());

-- Files policies
CREATE POLICY "Intranet admins can read files" ON intranet_files
    FOR SELECT USING (is_intranet_admin());
CREATE POLICY "Intranet admins can insert files" ON intranet_files
    FOR INSERT WITH CHECK (is_intranet_admin());
CREATE POLICY "Intranet admins can update files" ON intranet_files
    FOR UPDATE USING (is_intranet_admin());
CREATE POLICY "Intranet admins can delete files" ON intranet_files
    FOR DELETE USING (is_intranet_admin());

-- Events policies
CREATE POLICY "Intranet admins can read events" ON intranet_events
    FOR SELECT USING (is_intranet_admin());
CREATE POLICY "Intranet admins can insert events" ON intranet_events
    FOR INSERT WITH CHECK (is_intranet_admin());
CREATE POLICY "Intranet admins can update events" ON intranet_events
    FOR UPDATE USING (is_intranet_admin());
CREATE POLICY "Intranet admins can delete events" ON intranet_events
    FOR DELETE USING (is_intranet_admin());

-- Budget policies
CREATE POLICY "Intranet admins can read budget" ON intranet_budget
    FOR SELECT USING (is_intranet_admin());
CREATE POLICY "Intranet admins can insert budget" ON intranet_budget
    FOR INSERT WITH CHECK (is_intranet_admin());
CREATE POLICY "Intranet admins can update budget" ON intranet_budget
    FOR UPDATE USING (is_intranet_admin());
CREATE POLICY "Intranet admins can delete budget" ON intranet_budget
    FOR DELETE USING (is_intranet_admin());

-- ============================================
-- STORAGE BUCKET (for receipts and documents)
-- ============================================
-- NOTE: Run this separately or create the bucket manually in Supabase Dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('intranet', 'intranet', false);

-- Storage policies for the 'intranet' bucket
-- CREATE POLICY "Intranet admins can upload" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'intranet' AND is_intranet_admin());
-- CREATE POLICY "Intranet admins can read" ON storage.objects
--     FOR SELECT USING (bucket_id = 'intranet' AND is_intranet_admin());
-- CREATE POLICY "Intranet admins can delete" ON storage.objects
--     FOR DELETE USING (bucket_id = 'intranet' AND is_intranet_admin());
