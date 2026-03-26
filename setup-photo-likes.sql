-- 1. Añadir columna de conteo de likes a la tabla de fotos
ALTER TABLE user_photo_contributions 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 2. Crear tabla de likes para evitar duplicados y saber quién dio like a qué foto
CREATE TABLE IF NOT EXISTS photo_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES user_photo_contributions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    
    -- Un usuario solo puede darle like una vez a la misma foto
    UNIQUE(photo_id, user_id)
);

-- Habilitar RLS en la tabla photo_likes
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS) para photo_likes
DROP POLICY IF EXISTS "Cualquiera puede ver los likes" ON photo_likes;
-- Los usuarios pueden ver todos los likes (útil para contar o mostrar quién le dio like)
CREATE POLICY "Cualquiera puede ver los likes" 
ON photo_likes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Usuarios pueden dar like" ON photo_likes;
-- Los usuarios solo pueden insertar sus propios likes
CREATE POLICY "Usuarios pueden dar like" 
ON photo_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden quitar su like" ON photo_likes;
-- Los usuarios solo pueden eliminar sus propios likes
CREATE POLICY "Usuarios pueden quitar su like" 
ON photo_likes FOR DELETE 
USING (auth.uid() = user_id);


-- 3. Crear Función Segura (RPC) para Toogle (Dar/Quitar) Like
-- Esta función maneja la concurrencia y evita inconsistencias en el contador
CREATE OR REPLACE FUNCTION toggle_photo_like(p_photo_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con permisos elevados para actualizar el contador
AS $$
DECLARE
    v_user_id UUID;
    v_like_exists BOOLEAN;
BEGIN
    -- Obtener el ID del usuario actualmente autenticado
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Verificar si el like ya existe
    SELECT EXISTS (
        SELECT 1 FROM photo_likes 
        WHERE photo_id = p_photo_id AND user_id = v_user_id
    ) INTO v_like_exists;

    IF v_like_exists THEN
        -- Si existe, quitar el like (Dislike)
        DELETE FROM photo_likes 
        WHERE photo_id = p_photo_id AND user_id = v_user_id;
        
        -- Restar del contador general
        UPDATE user_photo_contributions 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = p_photo_id;
        
        RETURN FALSE; -- Retorna false indicando que ahora "No tiene like"
    ELSE
        -- Si no existe, agregar el like
        INSERT INTO photo_likes (photo_id, user_id) 
        VALUES (p_photo_id, v_user_id);
        
        -- Sumar al contador general
        UPDATE user_photo_contributions 
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = p_photo_id;
        
        RETURN TRUE; -- Retorna true indicando que ahora "Tiene like"
    END IF;
END;
$$;
