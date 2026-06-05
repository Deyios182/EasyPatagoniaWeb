-- ================================================================
-- EASY PATAGONIA — Sistema de Gamificación
-- Todas las tablas son administrables desde el panel SuperAdmin
-- ================================================================

-- ================================================================
-- 1. XP DEL USUARIO (solo sube, nunca baja)
-- ================================================================
CREATE TABLE IF NOT EXISTS user_xp (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),   -- siempre positivo
  reason TEXT NOT NULL,              -- 'post_approved', 'route_completed', 'medal_earned', 'manual'
  post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

-- ================================================================
-- 2. RANGOS (administrables desde el SuperAdmin)
-- ================================================================
CREATE TABLE IF NOT EXISTS gamification_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'Turista', 'Explorador Novato', etc.
  min_xp INTEGER NOT NULL DEFAULT 0,
  emoji TEXT DEFAULT '🎒',
  color_gradient TEXT DEFAULT 'from-slate-400 to-slate-600',  -- clases Tailwind
  hex_color TEXT DEFAULT '#64748B',
  benefits TEXT,                         -- Descripción de beneficios del rango
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE gamification_ranks ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🎒';
ALTER TABLE gamification_ranks ADD COLUMN IF NOT EXISTS color_gradient TEXT DEFAULT 'from-slate-400 to-slate-600';
ALTER TABLE gamification_ranks ADD COLUMN IF NOT EXISTS hex_color TEXT DEFAULT '#64748B';
ALTER TABLE gamification_ranks ADD COLUMN IF NOT EXISTS benefits TEXT;
ALTER TABLE gamification_ranks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE gamification_ranks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_ranks_sort ON gamification_ranks(sort_order, min_xp);

-- ================================================================
-- 3. MEDALLAS AUSTRALES (administrables desde el SuperAdmin)
-- ================================================================
CREATE TABLE IF NOT EXISTS gamification_medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,             -- 'navegante_austral', 'primer_destello', etc.
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏅',               -- emoji o URL de imagen
  medal_type TEXT NOT NULL DEFAULT 'objective',  -- 'objective', 'legendary', 'secret'
  trigger_type TEXT DEFAULT 'manual',    -- 'post_count', 'xp_threshold', 'manual', 'location'
  trigger_value JSONB,                   -- {"count": 5} | {"xp": 1000} | {"lat": -46.6, "lng": -72.7, "radius_m": 500}
  xp_reward INTEGER DEFAULT 0,
  is_secret BOOLEAN DEFAULT false,       -- Si true: muestra ??? hasta desbloquear
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🏅';
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS medal_type TEXT DEFAULT 'objective';
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'manual';
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS trigger_value JSONB;
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS is_secret BOOLEAN DEFAULT false;
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE gamification_medals ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Medallas ganadas por usuario
CREATE TABLE IF NOT EXISTS user_medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  medal_slug TEXT REFERENCES gamification_medals(slug) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- admin que la otorgó (si manual)
  UNIQUE(user_id, medal_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_medals_user ON user_medals(user_id);

-- ================================================================
-- 4. EASY RUTAS (administrables desde el SuperAdmin)
-- ================================================================
CREATE TABLE IF NOT EXISTS easy_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  total_km INTEGER,
  image_url TEXT,
  difficulty TEXT DEFAULT 'Moderado',   -- 'Fácil', 'Moderado', 'Difícil', 'Extremo'
  medal_slug TEXT REFERENCES gamification_medals(slug) ON DELETE SET NULL,
  xp_reward INTEGER DEFAULT 100,
  checkpoints JSONB DEFAULT '[]',
  -- Cada checkpoint: {"id": "cp1", "name": "Glaciar Exploradores", "lat": -46.5, "lng": -72.9, 
  --                   "description": "...", "image_url": "...", "xp_reward": 20}
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS total_km INTEGER;
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Moderado';
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS medal_slug TEXT;
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 100;
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS checkpoints JSONB DEFAULT '[]';
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE easy_routes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Progreso de usuario en rutas
CREATE TABLE IF NOT EXISTS user_route_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES easy_routes(id) ON DELETE CASCADE NOT NULL,
  checkpoints_completed TEXT[] DEFAULT '{}',  -- array de checkpoint IDs completados
  completed_at TIMESTAMPTZ,               -- NULL si aún no completó la ruta
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, route_id)
);

CREATE INDEX IF NOT EXISTS idx_route_progress_user ON user_route_progress(user_id);

-- ================================================================
-- 5. RLS POLICIES
-- ================================================================

-- user_xp: lectura pública, escritura solo con función o admin
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_xp_select" ON user_xp FOR SELECT USING (true);
CREATE POLICY "user_xp_insert_own" ON user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_xp_update_own" ON user_xp FOR UPDATE USING (auth.uid() = user_id);

-- xp_transactions: el usuario ve las suyas
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_trans_select_own" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "xp_trans_admin_all" ON xp_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin'))
);

-- gamification_ranks: lectura pública, escritura solo admin
ALTER TABLE gamification_ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranks_select_all" ON gamification_ranks FOR SELECT USING (true);
CREATE POLICY "ranks_admin_all" ON gamification_ranks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin'))
);

-- gamification_medals: lectura pública (excepto secretas sin ganar), escritura solo admin
ALTER TABLE gamification_medals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medals_select_public" ON gamification_medals FOR SELECT USING (is_secret = false OR is_active = true);
CREATE POLICY "medals_admin_all" ON gamification_medals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin'))
);

-- user_medals: el usuario ve las suyas, admin ve todas
ALTER TABLE user_medals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_medals_select_own" ON user_medals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_medals_admin_all" ON user_medals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin'))
);

-- easy_routes: lectura pública
ALTER TABLE easy_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routes_select_all" ON easy_routes FOR SELECT USING (true);
CREATE POLICY "routes_admin_all" ON easy_routes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin'))
);

-- user_route_progress: el usuario ve el suyo
ALTER TABLE user_route_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "route_progress_select_own" ON user_route_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "route_progress_upsert_own" ON user_route_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "route_progress_update_own" ON user_route_progress FOR UPDATE USING (auth.uid() = user_id);

-- ================================================================
-- 6. FUNCIÓN: Otorgar XP (usada por admin)
-- ================================================================
CREATE OR REPLACE FUNCTION grant_xp_to_user(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_post_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Insertar transacción
  INSERT INTO xp_transactions (user_id, amount, reason, post_id, admin_id, notes)
  VALUES (p_user_id, p_amount, p_reason, p_post_id, auth.uid(), p_notes);

  -- Actualizar balance total (upsert)
  INSERT INTO user_xp (user_id, total_xp, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE
  SET total_xp = user_xp.total_xp + p_amount,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 7. DATOS INICIALES — Rangos por defecto
-- ================================================================
INSERT INTO gamification_ranks (name, min_xp, emoji, color_gradient, hex_color, benefits, sort_order) VALUES
  ('Turista',             0,     '🎒', 'from-slate-400 to-slate-600',   '#64748B', 'Acceso básico a la plataforma',                                         1),
  ('Explorador Novato',   200,   '🧭', 'from-emerald-400 to-teal-600',  '#10B981', 'Acceso a Easy Rutas básicas',                                           2),
  ('Explorador Avanzado', 600,   '⛺', 'from-blue-400 to-indigo-600',   '#3B82F6', 'Descuentos en emprendedores locales + acceso a rutas avanzadas',         3),
  ('Explorador Máximo',   1500,  '🏔️', 'from-amber-400 to-orange-600',  '#F59E0B', 'Acceso prioritario + reconocimiento en el mural + beneficios especiales', 4),
  ('Pionero Legendario',  3000,  '🦅', 'from-purple-500 to-pink-600',   '#8B5CF6', 'Todos los beneficios + sello legendario + acceso exclusivo a zonas VIP',  5)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 8. DATOS INICIALES — Medallas por defecto
-- ================================================================
INSERT INTO gamification_medals (slug, name, description, icon, medal_type, trigger_type, trigger_value, xp_reward, is_secret, sort_order) VALUES
  -- Medallas de Objetivo (automáticas)
  ('primer_destello',      'Primer Destello',          'Publicaste tu primera foto en el Mural',                        '📸', 'objective', 'post_count', '{"type": "photo", "count": 1}',  50,  false, 1),
  ('explorador_mural',     'Explorador del Mural',     '5 publicaciones aprobadas en el Mural Global',                  '🗺️', 'objective', 'post_count', '{"type": "any", "count": 5}',    100, false, 2),
  ('voz_comunidad',        'Voz de la Comunidad',      '3 o más reseñas de negocios locales',                          '🌟', 'objective', 'post_count', '{"type": "review", "count": 3}', 80,  false, 3),
  ('guardian_rutas',       'Guardián de Rutas',        'Enviaste 2 o más alertas de ruta a la comunidad',              '⚡', 'objective', 'post_count', '{"type": "alert", "count": 2}',  60,  false, 4),
  ('nomada_austral',       'Nómada Austral',           'Completaste tu primera Easy Ruta',                             '🏕️', 'objective', 'manual',     null,                             150, false, 5),
  -- Medallas Legendarias (requieren validación admin)
  ('aliado_local',         'Aliado Local',             'Foto con 3 emprendedores locales de Patagonia',                '🤝', 'legendary', 'manual',     null,                             300, false, 10),
  ('guardian_comunitario', 'Guardián Comunitario',     'Participaste en 3 actividades locales de la comunidad',        '🌿', 'legendary', 'manual',     null,                             400, false, 11),
  ('leyenda_aysen',        'Leyenda de Aysén',         'Alcanzaste 3,000 XP — Pionero Legendario de la Patagonia',     '🏆', 'legendary', 'xp_threshold','{"xp": 3000}',                  500, false, 12),
  -- Medallas Secretas (ubicación geográfica)
  ('corazon_lago_carrera', 'Corazón del Lago Carrera', 'Llegaste al punto más remoto del Lago General Carrera',        '❤️', 'secret',    'location',   '{"lat": -46.55, "lng": -72.35, "radius_m": 1000}', 1000, true, 20)
ON CONFLICT (slug) DO NOTHING;
