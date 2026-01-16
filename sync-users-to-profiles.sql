    -- =====================================================
    -- SINCRONIZAR USUARIOS DE AUTH.USERS A PROFILES
    -- Ejecutar en Supabase SQL Editor
    -- =====================================================

    -- 1. Insertar usuarios faltantes en profiles (SIN full_name ya que es columna generada)
    INSERT INTO profiles (id, email, first_name, last_name, avatar_url, role, is_active, created_at)
    SELECT 
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'first_name', SPLIT_PART(au.raw_user_meta_data->>'full_name', ' ', 1), SPLIT_PART(au.email, '@', 1)),
        COALESCE(au.raw_user_meta_data->>'last_name', NULLIF(SPLIT_PART(au.raw_user_meta_data->>'full_name', ' ', 2), '')),
        COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture'),
        'tourist',  -- Default role
        true,       -- Active by default
        au.created_at
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE p.id IS NULL;

    -- 2. Verificar que la tabla profiles tiene RLS habilitado
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- 3. Política para que usuarios autenticados puedan leer TODOS los perfiles (para admin)
    DROP POLICY IF EXISTS "Allow authenticated to read all profiles" ON profiles;
    CREATE POLICY "Allow authenticated to read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

    -- 4. Política para que usuarios puedan actualizar su propio perfil
    DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
    CREATE POLICY "Allow users to update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

    -- 5. Política para INSERT (auto-crear perfil)
    DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
    CREATE POLICY "Allow users to insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

    -- 6. Trigger para auto-crear perfil cuando se registra un nuevo usuario
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
        INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url, role, is_active, created_at)
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'first_name', SPLIT_PART(new.raw_user_meta_data->>'full_name', ' ', 1), SPLIT_PART(new.email, '@', 1)),
            COALESCE(new.raw_user_meta_data->>'last_name', NULLIF(SPLIT_PART(new.raw_user_meta_data->>'full_name', ' ', 2), '')),
            COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
            'tourist',
            true,
            new.created_at
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 7. Crear el trigger si no existe
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    -- =====================================================
    -- VERIFICAR RESULTADOS
    -- =====================================================
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.role,
        p.is_active,
        p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
