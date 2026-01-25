-- =====================================================
-- FIX RLS RECURSION (Infinite Loop)
-- Soluciona el problema de que "desaparecieron las empresas"
-- =====================================================

-- 1. Sincronizar dueños principales a la tabla company_owners
-- Esto asegura que todos los dueños en 'companies' también estén en 'company_owners'
-- para no depender de consultar la tabla 'companies' en las políticas.
INSERT INTO company_owners (company_id, owner_id)
SELECT id, owner_id 
FROM companies 
WHERE owner_id IS NOT NULL
ON CONFLICT (company_id, owner_id) DO NOTHING;

-- 2. Eliminar las políticas recursivas anteriores
DROP POLICY IF EXISTS "Owners can view company owners" ON company_owners;
DROP POLICY IF EXISTS "Owners can insert company_owners" ON company_owners;
DROP POLICY IF EXISTS "Owners can delete company_owners" ON company_owners;
DROP POLICY IF EXISTS "Owners can view own assignments" ON company_owners;

-- 3. Crear políticas simplificadas (Sin consultar tabla companies para evitar bucle)

-- VIEW: Ver dueños de empresas a las que pertenezco (consultando solo company_owners)
CREATE POLICY "Owners can view company owners"
ON company_owners FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM company_owners 
    WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- INSERT: Agregar dueños a empresas a las que pertenezco
CREATE POLICY "Owners can insert company_owners"
ON company_owners FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM company_owners 
    WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- DELETE: Eliminar dueños de empresas a las que pertenezco
CREATE POLICY "Owners can delete company_owners"
ON company_owners FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM company_owners 
    WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);
