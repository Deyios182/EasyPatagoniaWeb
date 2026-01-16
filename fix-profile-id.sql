-- EJECUTAR ESTO EN SUPABASE SQL EDITOR
-- Insertar tu perfil directamente con el ID correcto

INSERT INTO profiles (id, email, first_name, last_name, avatar_url, role, is_active, created_at)
VALUES (
    'f14cda84-661d-4279-861d-634ae2951239',
    'thejozx.182@gmail.com',
    'Francisco',
    'Tejos Castillo',
    'https://lh3.googleusercontent.com/a/ACg8ocKbLaA4ZH-hKHhXqVrbetDQIrFf3pG_cej1xIHtCldnm4QBJw=s96-c',
    'super_admin',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    email = EXCLUDED.email;

-- Verificar resultado
SELECT * FROM profiles WHERE email = 'thejozx.182@gmail.com';
