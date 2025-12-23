-- =====================================================
-- FIX RLS POLICIES FOR ALL ADMIN TABLES
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. LOCALITIES - Políticas para lectura, inserción y actualización
ALTER TABLE localities ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT a todos (público)
DROP POLICY IF EXISTS "Allow public read access on localities" ON localities;
CREATE POLICY "Allow public read access on localities" 
ON localities FOR SELECT 
TO public 
USING (true);

-- Permitir INSERT/UPDATE/DELETE a usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated users to insert localities" ON localities;
CREATE POLICY "Allow authenticated users to insert localities" 
ON localities FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update localities" ON localities;
CREATE POLICY "Allow authenticated users to update localities" 
ON localities FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete localities" ON localities;
CREATE POLICY "Allow authenticated users to delete localities" 
ON localities FOR DELETE 
TO authenticated 
USING (true);

-- 2. ATTRACTIONS - Políticas para lectura, inserción y actualización
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on attractions" ON attractions;
CREATE POLICY "Allow public read access on attractions" 
ON attractions FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert attractions" ON attractions;
CREATE POLICY "Allow authenticated users to insert attractions" 
ON attractions FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update attractions" ON attractions;
CREATE POLICY "Allow authenticated users to update attractions" 
ON attractions FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete attractions" ON attractions;
CREATE POLICY "Allow authenticated users to delete attractions" 
ON attractions FOR DELETE 
TO authenticated 
USING (true);

-- 3. COMPANIES - Políticas para lectura, inserción y actualización
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on companies" ON companies;
CREATE POLICY "Allow public read access on companies" 
ON companies FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert companies" ON companies;
CREATE POLICY "Allow authenticated users to insert companies" 
ON companies FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON companies;
CREATE POLICY "Allow authenticated users to update companies" 
ON companies FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete companies" ON companies;
CREATE POLICY "Allow authenticated users to delete companies" 
ON companies FOR DELETE 
TO authenticated 
USING (true);

-- 4. SERVICES - Políticas para lectura, inserción y actualización
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on services" ON services;
CREATE POLICY "Allow public read access on services" 
ON services FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert services" ON services;
CREATE POLICY "Allow authenticated users to insert services" 
ON services FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update services" ON services;
CREATE POLICY "Allow authenticated users to update services" 
ON services FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete services" ON services;
CREATE POLICY "Allow authenticated users to delete services" 
ON services FOR DELETE 
TO authenticated 
USING (true);

-- =====================================================
-- VERIFICAR POLÍTICAS CREADAS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('localities', 'attractions', 'companies', 'services')
ORDER BY tablename, cmd;
