-- =====================================================
-- AGREGAR COLUMNA DESCRIPTION A LOCALITIES
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Agregar columna description si no existe
ALTER TABLE localities 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'localities';
