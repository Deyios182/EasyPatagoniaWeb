-- =====================================================
-- POLÍTICAS RLS PARA DUEÑOS DE EMPRESA
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. EMPRESAS: Dueños pueden leer y actualizar sus propias empresas
DROP POLICY IF EXISTS "Allow owners to read own companies" ON companies;
CREATE POLICY "Allow owners to read own companies"
ON companies FOR SELECT
TO authenticated
USING (owner_id = auth.uid() OR owner_id IS NULL);

DROP POLICY IF EXISTS "Allow owners to update own companies" ON companies;
CREATE POLICY "Allow owners to update own companies"
ON companies FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 2. SERVICIOS: Dueños pueden gestionar servicios de sus empresas
DROP POLICY IF EXISTS "Allow owners to read services" ON services;
CREATE POLICY "Allow owners to read services"
ON services FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM companies WHERE id = services.company_id AND owner_id IS NULL)
);

DROP POLICY IF EXISTS "Allow owners to insert services" ON services;
CREATE POLICY "Allow owners to insert services"
ON services FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Allow owners to update services" ON services;
CREATE POLICY "Allow owners to update services"
ON services FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    company_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Allow owners to delete services" ON services;
CREATE POLICY "Allow owners to delete services"
ON services FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
    )
);

-- 3. POLÍTICA GENERAL: Todos los usuarios autenticados pueden leer empresas activas
DROP POLICY IF EXISTS "Allow all to read active companies" ON companies;
CREATE POLICY "Allow all to read active companies"
ON companies FOR SELECT
TO authenticated
USING (is_active = true);

-- 4. POLÍTICA GENERAL: Todos pueden leer servicios de empresas activas
DROP POLICY IF EXISTS "Allow all to read services of active companies" ON services;
CREATE POLICY "Allow all to read services of active companies"
ON services FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM companies WHERE id = services.company_id AND is_active = true)
);

-- =====================================================
-- VERIFICAR POLÍTICAS
-- =====================================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('companies', 'services')
ORDER BY tablename, policyname;
