-- =====================================================
-- CONSULTA: Revisar Localidades Existentes
-- Descripción: Muestra todas las localidades en la base de datos
-- =====================================================

-- Ver TODAS las localidades con sus detalles
SELECT 
  id,
  name,
  latitude,
  longitude,
  is_active
FROM localities
ORDER BY name;

-- =====================================================
-- EJECUTAR ESTA CONSULTA EN SUPABASE Y COMPARTIR LOS RESULTADOS
-- =====================================================
