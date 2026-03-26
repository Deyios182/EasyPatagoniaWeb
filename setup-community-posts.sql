-- ==============================================================================
-- EASY PATAGONIA - COMMUNITY POSTS SCHEMA
-- Descripción: Script para generar un "Mural Global" tipo red social.
-- Soportará distintos tipos de posts: fotos, reseñas, alertas de ruta o historias.
-- ==============================================================================

-- 1. Crear tabla principal de publicaciones
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_type TEXT NOT NULL CHECK (post_type IN ('photo', 'review', 'alert', 'story')),
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}', -- Array de URLs de fotos/videos si existen
    location_name TEXT, -- Nombre del lugar en texto plano (ej: "Capillas de Mármol")
    attraction_id TEXT REFERENCES attractions(id) ON DELETE SET NULL, -- Si está vinculado a un atractivo oficial
    business_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- Si está vinculado a un negocio oficial
    locality_id TEXT REFERENCES localities(id) ON DELETE SET NULL, -- Para geolocalización regional
    likes_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Crear tabla de likes para las publicaciones (Evita likes duplicados)
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    
    -- Un usuario solo puede darle like una vez al mismo post
    UNIQUE(post_id, user_id)
);

-- ==============================================================================
-- SEGURIDAD (Row Level Security - RLS)
-- ==============================================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Políticas para community_posts
DROP POLICY IF EXISTS "Todos pueden leer posts aprobados" ON community_posts;
CREATE POLICY "Todos pueden leer posts aprobados" 
ON community_posts FOR SELECT 
USING (status = 'approved' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear posts" ON community_posts;
CREATE POLICY "Usuarios autenticados pueden crear posts" 
ON community_posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden borrar sus propios posts" ON community_posts;
CREATE POLICY "Usuarios pueden borrar sus propios posts" 
ON community_posts FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para post_likes
DROP POLICY IF EXISTS "Todos pueden ver la tabla de likes" ON post_likes;
CREATE POLICY "Todos pueden ver la tabla de likes" 
ON post_likes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Usuarios pueden dar like a los posts" ON post_likes;
CREATE POLICY "Usuarios pueden dar like a los posts" 
ON post_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden quitar su like de posts" ON post_likes;
CREATE POLICY "Usuarios pueden quitar su like de posts" 
ON post_likes FOR DELETE 
USING (auth.uid() = user_id);

-- ==============================================================================
-- FUNCIÓN RPC: Toggle Like (Dar/Quitar Me Gusta)
-- ==============================================================================
CREATE OR REPLACE FUNCTION toggle_community_like(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_like_exists BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado para dar like';
    END IF;

    -- Verificar si ya le dio like a este post
    SELECT EXISTS (
        SELECT 1 FROM post_likes 
        WHERE post_id = p_post_id AND user_id = v_user_id
    ) INTO v_like_exists;

    IF v_like_exists THEN
        -- Quitar like
        DELETE FROM post_likes 
        WHERE post_id = p_post_id AND user_id = v_user_id;
        
        -- Restar del contador general de forma segura
        UPDATE community_posts 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = p_post_id;
        
        RETURN FALSE; -- Significa "Ya no le gusta"
    ELSE
        -- Dar like
        INSERT INTO post_likes (post_id, user_id) 
        VALUES (p_post_id, v_user_id);
        
        -- Sumar al contador general
        UPDATE community_posts 
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = p_post_id;
        
        RETURN TRUE; -- Significa "Le gusta"
    END IF;
END;
$$;
