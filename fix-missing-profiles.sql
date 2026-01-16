-- =====================================================
-- CREAR PERFILES FALTANTES Y PERMITIR UPDATES
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. VER QUÉ USUARIOS FALTAN EN PROFILES
SELECT au.id, au.email, 'FALTA PERFIL' as status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 2. CREAR PERFILES FALTANTES PARA TODOS LOS USUARIOS
INSERT INTO profiles (id, email, first_name, last_name, avatar_url, role, is_active, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'first_name', 
        SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 1), 
        SPLIT_PART(au.email, '@', 1)
    ),
    COALESCE(
        au.raw_user_meta_data->>'last_name', 
        NULLIF(REGEXP_REPLACE(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), '^[^ ]+ *', ''), '')
    ),
    COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture'),
    'tourist',
    true,
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. AGREGAR POLÍTICA PARA PERMITIR UPDATE A TODOS LOS USUARIOS AUTENTICADOS (admin)
DROP POLICY IF EXISTS "Allow admin to update all profiles" ON profiles;
CREATE POLICY "Allow admin to update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. VERIFICAR TODOS LOS PERFILES
SELECT id, email, role, first_name, is_active 
FROM profiles 
ORDER BY created_at DESC;
