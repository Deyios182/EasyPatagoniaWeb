-- =====================================================
-- TABLA: company_owners
-- Relación many-to-many entre empresas y dueños
-- =====================================================

-- Crear tabla de relación
CREATE TABLE IF NOT EXISTS company_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, owner_id) -- Evitar duplicados
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_company_owners_company ON company_owners(company_id);
CREATE INDEX IF NOT EXISTS idx_company_owners_owner ON company_owners(owner_id);

-- =====================================================
-- MIGRAR DATOS EXISTENTES
-- =====================================================

-- Copiar owner_id actual a company_owners (solo si no está NULL)
INSERT INTO company_owners (company_id, owner_id)
SELECT id, owner_id 
FROM companies 
WHERE owner_id IS NOT NULL
ON CONFLICT (company_id, owner_id) DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE company_owners ENABLE ROW LEVEL SECURITY;

-- SuperAdmins pueden ver todas las relaciones
DROP POLICY IF EXISTS "SuperAdmins can view all company_owners" ON company_owners;
CREATE POLICY "SuperAdmins can view all company_owners"
ON company_owners FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- SuperAdmins pueden insertar relaciones
DROP POLICY IF EXISTS "SuperAdmins can insert company_owners" ON company_owners;
CREATE POLICY "SuperAdmins can insert company_owners"
ON company_owners FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- SuperAdmins pueden eliminar relaciones
DROP POLICY IF EXISTS "SuperAdmins can delete company_owners" ON company_owners;
CREATE POLICY "SuperAdmins can delete company_owners"
ON company_owners FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Los dueños pueden ver sus propias asignaciones
DROP POLICY IF EXISTS "Owners can view own assignments" ON company_owners;
CREATE POLICY "Owners can view own assignments"
ON company_owners FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- =====================================================
-- ACTUALIZAR RLS DE COMPANIES
-- =====================================================

-- Los dueños pueden ver empresas donde están asignados
DROP POLICY IF EXISTS "Business owners can view own companies" ON companies;
CREATE POLICY "Business owners can view own companies"
ON companies FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM company_owners 
    WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Los dueños pueden actualizar empresas donde están asignados
DROP POLICY IF EXISTS "Business owners can update own companies" ON companies;
CREATE POLICY "Business owners can update own companies"
ON companies FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id FROM company_owners 
    WHERE owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- =====================================================
-- VERIFICAR
-- =====================================================
SELECT * FROM company_owners LIMIT 10;
