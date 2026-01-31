-- =====================================================
-- SISTEMA DE CONTRIBUCIÓN DE FOTOS POR TURISTAS
-- =====================================================

-- Tabla para almacenar fotos subidas por usuarios
CREATE TABLE public.user_photo_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id text NOT NULL REFERENCES public.attractions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  user_email text,
  photo_url text NOT NULL,
  photo_description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para mejor performance
CREATE INDEX idx_photo_contributions_status ON user_photo_contributions(status);
CREATE INDEX idx_photo_contributions_attraction ON user_photo_contributions(attraction_id);
CREATE INDEX idx_photo_contributions_created ON user_photo_contributions(created_at DESC);
CREATE INDEX idx_photo_contributions_user ON user_photo_contributions(user_id) WHERE user_id IS NOT NULL;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_photo_contributions_updated_at
  BEFORE UPDATE ON user_photo_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE user_photo_contributions ENABLE ROW LEVEL SECURITY;

-- Policy: Cualquiera puede VER fotos aprobadas
CREATE POLICY "Anyone can view approved photos"
  ON user_photo_contributions FOR SELECT
  USING (status = 'approved');

-- Policy: Usuarios autenticados pueden ver sus propias fotos
CREATE POLICY "Users can view own photos"
  ON user_photo_contributions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Cualquiera puede INSERTAR fotos (turistas)
CREATE POLICY "Anyone can submit photos"
  ON user_photo_contributions FOR INSERT
  WITH CHECK (status = 'pending');

-- Policy: Solo el usuario puede ACTUALIZAR su propia foto si está pendiente
CREATE POLICY "Users can update own pending photos"
  ON user_photo_contributions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (status = 'pending');

-- =====================================================
-- ACTUALIZAR TABLA ATTRACTIONS
-- =====================================================

-- Agregar campos para tracking de contribuciones
ALTER TABLE public.attractions 
ADD COLUMN IF NOT EXISTS user_contributed_images integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_image_update timestamp with time zone;

-- =====================================================
-- FUNCIÓN: Aprobar Foto
-- =====================================================

CREATE OR REPLACE FUNCTION approve_photo_contribution(
  contribution_id uuid,
  admin_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attraction_id text;
  v_photo_url text;
  v_current_image text;
BEGIN
  -- Verificar que el usuario es admin (esto debe configurarse en auth metadata)
  -- Por ahora solo verificamos que existe el user_id
  
  -- Obtener datos de la contribución
  SELECT attraction_id, photo_url
  INTO v_attraction_id, v_photo_url
  FROM user_photo_contributions
  WHERE id = contribution_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contribution not found or not pending';
  END IF;
  
  -- Obtener imagen actual del atractivo
  SELECT main_image_url INTO v_current_image
  FROM attractions
  WHERE attractions.id = v_attraction_id;
  
  -- Actualizar el estado de la contribución
  UPDATE user_photo_contributions
  SET 
    status = 'approved',
    reviewed_by = admin_user_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = contribution_id;
  
  -- Si el atractivo no tiene imagen, usar esta como principal
  IF v_current_image IS NULL THEN
    UPDATE attractions
    SET 
      main_image_url = v_photo_url,
      user_contributed_images = COALESCE(user_contributed_images, 0) + 1,
      last_image_update = now()
    WHERE attractions.id = v_attraction_id;
  ELSE
    -- Si ya tiene imagen, añadir a la galería
    UPDATE attractions
    SET 
      gallery_urls = array_append(COALESCE(gallery_urls, ARRAY[]::text[]), v_photo_url),
      user_contributed_images = COALESCE(user_contributed_images, 0) + 1,
      last_image_update = now()
    WHERE attractions.id = v_attraction_id;
  END IF;
  
END;
$$;

-- =====================================================
-- FUNCIÓN: Rechazar Foto
-- =====================================================

CREATE OR REPLACE FUNCTION reject_photo_contribution(
  contribution_id uuid,
  admin_user_id uuid,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_photo_contributions
  SET 
    status = 'rejected',
    reviewed_by = admin_user_id,
    reviewed_at = now(),
    rejection_reason = reason,
    updated_at = now()
  WHERE id = contribution_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contribution not found or not pending';
  END IF;
END;
$$;

-- =====================================================
-- VISTA: Estadísticas de Contribuciones por Usuario
-- =====================================================

CREATE OR REPLACE VIEW user_contribution_stats AS
SELECT 
  user_id,
  user_name,
  user_email,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) as total_contributions,
  MAX(created_at) FILTER (WHERE status = 'approved') as last_approved_at
FROM user_photo_contributions
WHERE user_id IS NOT NULL
GROUP BY user_id, user_name, user_email;

-- =====================================================
-- VISTA: Fotos Pendientes de Aprobación
-- =====================================================

CREATE OR REPLACE VIEW pending_photo_contributions AS
SELECT 
  pc.id,
  pc.attraction_id,
  a.name as attraction_name,
  a.locality_id,
  l.name as locality_name,
  pc.user_id,
  pc.user_name,
  pc.user_email,
  pc.photo_url,
  pc.photo_description,
  pc.created_at,
  pc.updated_at
FROM user_photo_contributions pc
LEFT JOIN attractions a ON pc.attraction_id = a.id
LEFT JOIN localities l ON a.locality_id = l.id
WHERE pc.status = 'pending'
ORDER BY pc.created_at ASC;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE user_photo_contributions IS 'Fotos subidas por turistas para atractivos turísticos, sujetas a aprobación por administradores';
COMMENT ON COLUMN user_photo_contributions.status IS 'Estado de la foto: pending (pendiente), approved (aprobada), rejected (rechazada)';
COMMENT ON COLUMN user_photo_contributions.user_id IS 'ID del usuario autenticado (NULL si es anónimo)';
COMMENT ON FUNCTION approve_photo_contribution IS 'Aprueba una contribución de foto y la asigna al atractivo correspondiente';
COMMENT ON FUNCTION reject_photo_contribution IS 'Rechaza una contribución de foto con una razón opcional';
