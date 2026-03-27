-- ==============================================================================
-- EASY PATAGONIA - USER SOCIAL SYSTEM
-- Tablas: user_follows, direct_messages
-- Extensiones a profiles
-- ==============================================================================

-- 1. Seguir usuarios
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos pueden leer follows" ON user_follows;
CREATE POLICY "Todos pueden leer follows" ON user_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios pueden seguir" ON user_follows;
CREATE POLICY "Usuarios pueden seguir" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Usuarios pueden dejar de seguir" ON user_follows;
CREATE POLICY "Usuarios pueden dejar de seguir" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- 2. Mensajes directos (solo si se siguen mutuamente)
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    read BOOLEAN DEFAULT false
);
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participantes pueden leer mensajes" ON direct_messages;
CREATE POLICY "Participantes pueden leer mensajes" ON direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Usuarios pueden enviar mensajes" ON direct_messages;
CREATE POLICY "Usuarios pueden enviar mensajes" ON direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus mensajes" ON direct_messages;
CREATE POLICY "Usuarios pueden actualizar sus mensajes" ON direct_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- 3. Extender tabla profiles con campos de personalización
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS origin_country TEXT,
    ADD COLUMN IF NOT EXISTS profile_banner_url TEXT,
    ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#FF6B35',
    ADD COLUMN IF NOT EXISTS travel_quote TEXT;
