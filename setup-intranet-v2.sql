-- ============================================
-- INTRANET EASY PATAGONIA - V2 UPGRADE
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- 1. Añadir metadatos a las carpetas (Fecha y Observaciones)
ALTER TABLE intranet_folders 
ADD COLUMN IF NOT EXISTS folder_date DATE,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Crear tabla de Transacciones Recurrentes
CREATE TABLE IF NOT EXISTS intranet_recurring_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'general',
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_months INT, -- Si es null, dura para siempre (ej: luz, internet). Si es 5, dura 5 cuotas.
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- RLS y Políticas
ALTER TABLE intranet_recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intranet admins can read recurring" ON intranet_recurring_transactions
    FOR SELECT USING (is_intranet_admin());
CREATE POLICY "Intranet admins can insert recurring" ON intranet_recurring_transactions
    FOR INSERT WITH CHECK (is_intranet_admin());
CREATE POLICY "Intranet admins can update recurring" ON intranet_recurring_transactions
    FOR UPDATE USING (is_intranet_admin());
CREATE POLICY "Intranet admins can delete recurring" ON intranet_recurring_transactions
    FOR DELETE USING (is_intranet_admin());

-- 3. Añadir metadatos a los archivos
ALTER TABLE intranet_files
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'Varios';
