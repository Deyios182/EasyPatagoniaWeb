-- =====================================================
-- SCRIPT DEFINITIVO - FORZAR VALORES EN LA BD
-- Ejecuta esto en Supabase SQL Editor
-- =====================================================

-- Actualizar HERO
UPDATE landing_content 
SET 
  title = 'Patagonia Sin Límites',
  subtitle = 'Menos planificación. Más Patagonia.',
  image_url = 'https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070'
WHERE key = 'hero';

-- Actualizar VISION
UPDATE landing_content 
SET 
  title = 'Nuestra Visión',
  body = 'Convertirnos en la plataforma turística líder de toda la Patagonia —chilena y argentina— integrando tecnología, sostenibilidad y desarrollo comunitario.',
  image_url = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000'
WHERE key = 'vision';

-- Actualizar MISSION
UPDATE landing_content 
SET 
  title = 'Nuestra Misión',
  body = 'Impulsar el desarrollo turístico de la Región de Aysén mediante una plataforma innovadora que conecta a viajeros con experiencias auténticas, la naturaleza y las comunidades locales.'
WHERE key = 'mission';

-- Actualizar PILLAR 1
UPDATE landing_content 
SET 
  title = 'Conexión y Autenticidad',
  body = 'Ser la plataforma líder que conecta a los viajeros con experiencias auténticas.'
WHERE key = 'pillar_1';

-- Actualizar PILLAR 2
UPDATE landing_content 
SET 
  title = 'Planificación Simple',
  body = 'Soluciones innovadoras para simplificar tu viaje: hospedaje, gastronomía y tours.'
WHERE key = 'pillar_2';

-- Actualizar PILLAR 3
UPDATE landing_content 
SET 
  title = 'Turismo Sostenible',
  body = 'Promover un turismo responsable que respeta la riqueza natural de la Patagonia.'
WHERE key = 'pillar_3';

-- Actualizar CONTACT SECTION
UPDATE landing_content 
SET 
  title = '¡Únete a la Aventura EasyPatagonia!',
  subtitle = 'Síguenos en nuestras plataformas para no perderte ninguna novedad.'
WHERE key = 'contact_section';

-- VERIFICAR QUE SE ACTUALIZARON
SELECT key, title, subtitle, LEFT(body, 50) as body_preview FROM landing_content ORDER BY key;
