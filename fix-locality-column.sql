-- Verificar y agregar columna locality_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'locality_id'
    ) THEN
        ALTER TABLE companies ADD COLUMN locality_id UUID REFERENCES localities(id);
        RAISE NOTICE 'Columna locality_id agregada a companies';
    ELSE
        RAISE NOTICE 'Columna locality_id ya existe en companies';
    END IF;
END $$;

-- Verificar la estructura actual
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;
