-- ============================================================
-- EASY PATAGONIA — Videos de Redes Sociales (Landing + Colaboradores)
-- Ejecuta este script en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS social_videos (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now(),
  company_id          uuid REFERENCES companies(id) ON DELETE CASCADE,
  -- NULL = video oficial de EasyPatagonia (Landing Page)
  -- NOT NULL = video de un colaborador / empresa

  title               text NOT NULL,
  platform            text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  video_url           text NOT NULL,
  thumbnail_url       text,
  handle              text,
  is_featured_landing boolean DEFAULT false,
  is_active           boolean DEFAULT true,
  order_position      int DEFAULT 0,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE social_videos ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE social_videos ADD COLUMN IF NOT EXISTS handle text;

CREATE INDEX IF NOT EXISTS idx_social_videos_company  ON social_videos (company_id);
CREATE INDEX IF NOT EXISTS idx_social_videos_active   ON social_videos (is_active);
CREATE INDEX IF NOT EXISTS idx_social_videos_landing  ON social_videos (is_featured_landing);

-- ── Función segura para validar permisos ──────────────────────
CREATE OR REPLACE FUNCTION public.can_manage_social_video(target_company_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- SuperAdmin puede gestionar cualquier video (oficiales y de empresas)
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND lower(role) IN ('super_admin', 'superadmin', 'admin')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Dueño de empresa puede gestionar videos de su empresa
  IF target_company_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = target_company_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.company_owners
      WHERE company_id = target_company_id AND owner_id = auth.uid()
    )
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE social_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_videos_public_read" ON social_videos;
CREATE POLICY "social_videos_public_read"
  ON social_videos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "social_videos_manage" ON social_videos;
CREATE POLICY "social_videos_manage"
  ON social_videos FOR ALL
  TO authenticated
  USING ( public.can_manage_social_video(company_id) )
  WITH CHECK ( public.can_manage_social_video(company_id) );
