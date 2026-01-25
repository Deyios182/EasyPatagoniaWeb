-- =====================================================
-- FIX RLS RECURSION (FINAL) - SECURITY DEFINER
-- Soluciona el Error 500 usando una función segura
-- =====================================================

-- 1. Crear función segura para verificar acceso (Rompe el bucle infinito)
-- SECURITY DEFINER hace que la función se ejecute con permisos de administrador, ignorando RLS dentro de ella.
CREATE OR REPLACE FUNCTION public.has_company_access(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar si el usuario está autenticado
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Check Super Admin
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check si es el dueño principal en 'companies'
  IF EXISTS (
    SELECT 1 FROM companies
    WHERE id = target_company_id AND owner_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  -- 3. Check si es co-dueño en 'company_owners'
  IF EXISTS (
    SELECT 1 FROM company_owners
    WHERE company_id = target_company_id AND owner_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- APLICAR NUEVAS POLÍTICAS
-- =====================================================

-- -----------------------------------------------------
-- TABLE: company_owners
-- -----------------------------------------------------

-- Limpiar políticas anteriores conflictivas
DROP POLICY IF EXISTS "Owners can view company owners" ON company_owners;
DROP POLICY IF EXISTS "Owners can insert company_owners" ON company_owners;
DROP POLICY IF EXISTS "Owners can delete company_owners" ON company_owners;
DROP POLICY IF EXISTS "Owners can view own assignments" ON company_owners;
DROP POLICY IF EXISTS "SuperAdmins can view all company_owners" ON company_owners;
DROP POLICY IF EXISTS "SuperAdmins can insert company_owners" ON company_owners;
DROP POLICY IF EXISTS "SuperAdmins can delete company_owners" ON company_owners;

-- SELECT: Ver lista de dueños si tengo acceso a la empresa
CREATE POLICY "Allow view company_owners"
ON company_owners FOR SELECT
TO authenticated
USING ( has_company_access(company_id) );

-- INSERT: Agregar dueños si tengo acceso a la empresa
CREATE POLICY "Allow insert company_owners"
ON company_owners FOR INSERT
TO authenticated
WITH CHECK ( has_company_access(company_id) );

-- DELETE: Eliminar dueños si tengo acceso a la empresa
CREATE POLICY "Allow delete company_owners"
ON company_owners FOR DELETE
TO authenticated
USING ( has_company_access(company_id) );

-- -----------------------------------------------------
-- TABLE: companies (Actualizar para usar la función y evitar conflictos)
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Allow owners to read own companies" ON companies;
DROP POLICY IF EXISTS "Business owners can view own companies" ON companies;
DROP POLICY IF EXISTS "Allow all to read active companies" ON companies;
DROP POLICY IF EXISTS "Allow public read access on companies" ON companies;

-- SELECT: Público ve activas, Dueños ven las suyas (usando la función)
CREATE POLICY "Startups and Public check"
ON companies FOR SELECT
TO public
USING (
  is_active = true 
  OR 
  (auth.role() = 'authenticated' AND has_company_access(id))
);

DROP POLICY IF EXISTS "Allow owners to update own companies" ON companies;
DROP POLICY IF EXISTS "Business owners can update own companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON companies;

-- UPDATE: Solo dueños (usando la función)
CREATE POLICY "Owners update companies"
ON companies FOR UPDATE
TO authenticated
USING ( has_company_access(id) )
WITH CHECK ( has_company_access(id) );
