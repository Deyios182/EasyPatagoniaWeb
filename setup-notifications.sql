-- ==============================================================
-- EASY PATAGONIA - Sistema de Notificaciones
-- ==============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,   -- destinatario
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,          -- quien la dispara
    type TEXT NOT NULL CHECK (type IN ('like', 'message', 'follow', 'mention')),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,       -- nullable
    message TEXT,                                                        -- texto libre
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solo el dueño puede leer sus notificaciones" ON notifications;
CREATE POLICY "Solo el dueño puede leer sus notificaciones" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear notificaciones" ON notifications;
CREATE POLICY "Usuarios autenticados pueden crear notificaciones" ON notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Dueño puede marcar como leída" ON notifications;
CREATE POLICY "Dueño puede marcar como leída" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);
