-- =====================================================
-- ADD BUSINESS HOURS COLUMNS TO COMPANIES TABLE
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Agregar columnas de horario
ALTER TABLE companies ADD COLUMN IF NOT EXISTS opening_time TEXT DEFAULT '09:00';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS closing_time TEXT DEFAULT '19:00';

-- 2. Verificar
SELECT id, name, opening_time, closing_time FROM companies LIMIT 10;
