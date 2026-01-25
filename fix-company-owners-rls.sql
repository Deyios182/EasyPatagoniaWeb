-- =====================================================
-- FIX RLS POLICIES FOR COMPANY OWNERS
-- Permitir que los dueños agreguen a otros dueños
-- =====================================================

-- 1. Habilitar inserción para dueños existentes
DROP POLICY IF EXISTS "Owners can insert company_owners" ON company_owners;
CREATE POLICY "Owners can insert company_owners"
ON company_owners FOR INSERT
TO authenticated
WITH CHECK (
  -- El usuario debe ser dueño de la empresa en la tabla 'companies'
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_owners.company_id
    AND companies.owner_id = auth.uid()
  )
  OR
  -- O el usuario ya debe estar en la lista de dueños de esa empresa
  EXISTS (
    SELECT 1 FROM company_owners AS co
    WHERE co.company_id = company_owners.company_id
    AND co.owner_id = auth.uid()
  )
  OR
  -- O es superadmin
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- 2. Habilitar borrado para dueños existentes
DROP POLICY IF EXISTS "Owners can delete company_owners" ON company_owners;
CREATE POLICY "Owners can delete company_owners"
ON company_owners FOR DELETE
TO authenticated
USING (
  -- El usuario debe ser dueño de la empresa en la tabla 'companies'
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_owners.company_id
    AND companies.owner_id = auth.uid()
  )
  OR
  -- O el usuario ya debe estar en la lista de dueños de esa empresa
  EXISTS (
    SELECT 1 FROM company_owners AS co
    WHERE co.company_id = company_owners.company_id
    AND co.owner_id = auth.uid()
  )
  OR
  -- O es superadmin
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- 3. Asegurar lectura (Select) para dueños
DROP POLICY IF EXISTS "Owners can view own assignments" ON company_owners;
CREATE POLICY "Owners can view company owners"
ON company_owners FOR SELECT
TO authenticated
USING (
   -- El usuario debe ser dueño de la empresa en la tabla 'companies'
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_owners.company_id
    AND companies.owner_id = auth.uid()
  )
  OR
  -- O el usuario ya debe estar en la lista de dueños de esa empresa
  EXISTS (
    SELECT 1 FROM company_owners AS co
    WHERE co.company_id = company_owners.company_id
    AND co.owner_id = auth.uid()
  )
   OR
  -- O es superadmin
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);
