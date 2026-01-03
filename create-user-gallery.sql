-- =====================================================
-- TABLA: user_gallery
-- Galería personal de imágenes por usuario
-- =====================================================

-- Crear tabla
CREATE TABLE IF NOT EXISTS user_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('logo', 'gallery', 'service')),
  name TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_gallery_owner ON user_gallery(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_gallery_type ON user_gallery(image_type);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE user_gallery ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias imágenes
DROP POLICY IF EXISTS "Users can view own gallery" ON user_gallery;
CREATE POLICY "Users can view own gallery"
ON user_gallery FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Los usuarios solo pueden insertar en su propia galería
DROP POLICY IF EXISTS "Users can insert own images" ON user_gallery;
CREATE POLICY "Users can insert own images"
ON user_gallery FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Los usuarios solo pueden eliminar sus propias imágenes
DROP POLICY IF EXISTS "Users can delete own images" ON user_gallery;
CREATE POLICY "Users can delete own images"
ON user_gallery FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- =====================================================
-- VERIFICAR
-- =====================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_gallery';
