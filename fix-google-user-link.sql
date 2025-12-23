-- ============================================
-- VINCULAR GOOGLE CON SUPERADMIN EXISTENTE
-- ============================================
-- Este script vincula tu Google OAuth con tu SuperAdmin SIN duplicar datos

-- ====================================
-- PASO 1: Obtener tu Google User ID
-- ====================================
-- Ejecuta esto y COPIA el 'id' que aparece
SELECT id, email, raw_user_meta_data->>'full_name' as nombre
FROM auth.users 
WHERE email LIKE '%@gmail.com%'
ORDER BY created_at DESC
LIMIT 5;

-- Resultado esperado:
-- id: f14cda84-661d-4279-861d-634ae2951239 (COPIA ESTE)
-- email: tu@gmail.com


-- ====================================
-- PASO 2: Ver tu SuperAdmin actual
-- ====================================
-- Ejecuta esto y COPIA el 'id' de tu SuperAdmin
SELECT 
    u.id,
    u.username,
    p.email,
    p.first_name,
    array_agg(r.name) as roles
FROM users u
LEFT JOIN persons p ON u.person_id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, p.email, p.first_name
HAVING 'super_admin' = ANY(array_agg(r.name));

-- Resultado esperado:
-- id: 12345678-1234-1234-1234-123456789012 (COPIA ESTE)
-- roles: {super_admin}


-- ====================================
-- PASO 3: VINCULAR (Reemplaza los IDs)
-- ====================================
-- IMPORTANTE: Reemplaza estos valores con los que copiaste arriba:
-- - GOOGLE_ID = El ID del PASO 1
-- - SUPERADMIN_ID = El ID del PASO 2

BEGIN;

-- 1. Actualizar user_roles primero (por foreign key)
UPDATE user_roles 
SET user_id = 'GOOGLE_ID'
WHERE user_id = 'SUPERADMIN_ID';

-- 2. Actualizar saved_itineraries si existen
UPDATE saved_itineraries 
SET user_id = 'GOOGLE_ID'
WHERE user_id = 'SUPERADMIN_ID';

-- 3. Actualizar users (cambiar el ID)
UPDATE users 
SET id = 'GOOGLE_ID'
WHERE id = 'SUPERADMIN_ID';

COMMIT;


-- ====================================
-- PASO 4: VERIFICAR que funcionó
-- ====================================
-- Reemplaza GOOGLE_ID con tu ID de Google
SELECT 
    u.id,
    u.username,
    p.email,
    p.first_name,
    array_agg(r.name) as roles
FROM users u
LEFT JOIN persons p ON u.person_id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = 'GOOGLE_ID'
GROUP BY u.id, u.username, p.email, p.first_name;

-- Deberías ver:
-- roles: {super_admin}


-- ====================================
-- OPCIONAL: Trigger para futuros usuarios
-- ====================================
-- Solo ejecuta esto si quieres que nuevos usuarios de Google
-- se creen automáticamente en la BD

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_person_id UUID;
    v_username TEXT;
BEGIN
    -- Solo crear si NO existe ya
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
        v_username := SPLIT_PART(NEW.email, '@', 1);
        
        INSERT INTO persons (email, first_name, last_name, person_type)
        VALUES (
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
            '',
            'tourist'
        )
        RETURNING id INTO v_person_id;
        
        INSERT INTO users (id, username, person_id, is_active)
        VALUES (NEW.id, v_username, v_person_id, true);
        
        INSERT INTO user_roles (user_id, role_id)
        SELECT NEW.id, id FROM roles WHERE name = 'tourist' LIMIT 1;
    END IF;
    
    return NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
