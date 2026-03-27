-- ==============================================================
-- EASY PATAGONIA - Web Push Subscriptions
-- ==============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden manejar sus propias suscripciones" ON push_subscriptions;
CREATE POLICY "Usuarios pueden manejar sus propias suscripciones" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Opcional: Trigger simplificado si no usas Webhooks desde Dashboard
-- Este trigger no envía el push directamente, sino que llama a una función edge de Supabase via HTTP
-- (Es más fácil configurar Database Webhooks desde el panel de Supabase que crear el trigger manual aquí).
