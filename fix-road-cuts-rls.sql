-- ============================================================
-- FIX RLS PARA road_cuts (Permite crear, editar y eliminar a SuperAdmin)
-- Ejecuta este script en Supabase SQL Editor
-- ============================================================

-- 1. Función segura SECURITY DEFINER (evita bloqueos por RLS en profiles)
CREATE OR REPLACE FUNCTION public.is_road_cuts_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND lower(role) IN ('super_admin', 'superadmin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurar RLS habilitado
ALTER TABLE road_cuts ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas anteriores
DROP POLICY IF EXISTS "road_cuts_public_read" ON road_cuts;
DROP POLICY IF EXISTS "road_cuts_superadmin_all" ON road_cuts;

-- 4. Lectura pública (mapa y visitantes)
CREATE POLICY "road_cuts_public_read"
  ON road_cuts FOR SELECT
  USING (true);

-- 5. Escritura completa para SuperAdmin (INSERT, UPDATE, DELETE)
CREATE POLICY "road_cuts_superadmin_all"
  ON road_cuts FOR ALL
  TO authenticated
  USING ( public.is_road_cuts_admin() )
  WITH CHECK ( public.is_road_cuts_admin() );
