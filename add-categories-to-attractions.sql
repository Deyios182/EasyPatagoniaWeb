-- =====================================================
-- MIGRACIÓN: Agregar categorías a attractions
-- =====================================================

-- Agregar campo category
ALTER TABLE public.attractions 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'attraction';

-- Actualizar bencineras existentes
UPDATE attractions 
SET category = 'gas_station' 
WHERE keywords @> ARRAY['bencinera'] 
   OR keywords @> ARRAY['combustible']
   OR keywords @> ARRAY['gasolinera']
   OR name ILIKE '%bencinera%'
   OR name ILIKE '%combustible%';

-- Actualizar campings existentes
UPDATE attractions 
SET category = 'camping' 
WHERE keywords @> ARRAY['camping'] 
   OR keywords @> ARRAY['campamento']
   OR name ILIKE '%camping%'
   OR name ILIKE '%campamento%';

-- Asegurar que el resto son attractions
UPDATE attractions 
SET category = 'attraction' 
WHERE category IS NULL;

-- Agregar constraint para validar valores
ALTER TABLE attractions 
DROP CONSTRAINT IF EXISTS category_check;

ALTER TABLE attractions 
ADD CONSTRAINT category_check 
CHECK (category IN ('attraction', 'gas_station', 'camping'));

-- Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions(category);

-- Verificar resultados
SELECT 
  category,
  COUNT(*) as count
FROM attractions
GROUP BY category
ORDER BY count DESC;
