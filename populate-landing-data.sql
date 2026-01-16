-- =====================================================
-- SCRIPT DE VERIFICACIÓN Y POBLACIÓN DE DATOS
-- Ejecuta esto en Supabase SQL Editor para poblar los datos
-- =====================================================

-- 1. LIMPIAR Y REPOBLAR CARRUSEL
-- =====================================================
DELETE FROM landing_carousel;

INSERT INTO landing_carousel (image_url, order_position, alt_text) VALUES
  ('https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070', 1, 'Patagonia Landscape 1'),
  ('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000', 2, 'Patagonia Mountain Vista'),
  ('https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074', 3, 'Patagonia Nature');

-- 2. LIMPIAR Y REPOBLAR CONTENIDO
-- =====================================================
DELETE FROM landing_content;

INSERT INTO landing_content (key, title, subtitle, body, image_url) VALUES
  ('hero', 'Patagonia Sin Límites', 'Menos planificación. Más Patagonia.', NULL, 'https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070'),
  ('vision', 'Nuestra Visión', NULL, 'Convertirnos en la plataforma turística líder de toda la Patagonia —chilena y argentina— integrando tecnología, sostenibilidad y desarrollo comunitario.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000'),
  ('mission', 'Nuestra Misión', NULL, 'Impulsar el desarrollo turístico de la Región de Aysén mediante una plataforma innovadora que conecta a viajeros con experiencias auténticas, la naturaleza y las comunidades locales.', NULL),
  ('pillar_1', 'Conexión y Autenticidad', NULL, 'Ser la plataforma líder que conecta a los viajeros con experiencias auténticas.', NULL),
  ('pillar_2', 'Planificación Simple', NULL, 'Soluciones innovadoras para simplificar tu viaje: hospedaje, gastronomía y tours.', NULL),
  ('pillar_3', 'Turismo Sostenible', NULL, 'Promover un turismo responsable que respeta la riqueza natural de la Patagonia.', NULL),
  ('contact_section', '¡Únete a la Aventura EasyPatagonia!', 'Síguenos en nuestras plataformas para no perderte ninguna novedad.', NULL, NULL);

-- 3. LIMPIAR Y REPOBLAR SETTINGS
-- =====================================================
DELETE FROM landing_settings;

INSERT INTO landing_settings (key, value, type, category) VALUES
  ('contact_whatsapp', '56956425005', 'text', 'contact'),
  ('contact_email', 'infoeasypatagonia@gmail.com', 'email', 'contact'),
  ('contact_address', 'Puerto Río Tranquilo, Aysén', 'text', 'contact'),
  ('social_instagram', 'https://www.instagram.com/easy.patagonia', 'url', 'social'),
  ('social_tiktok', 'https://www.tiktok.com/@easy.patagonia?_t=ZM-8srRmTRFV1q&_r=1', 'url', 'social'),
  ('social_facebook', '', 'url', 'social'),
  ('color_primary', '#dd6e42', 'color', 'theme'),
  ('color_secondary', '#4f6d7a', 'color', 'theme'),
  ('color_accent', '#e8dab2', 'color', 'theme'),
  ('color_background', '#eaeaea', 'color', 'theme'),
  ('theme_mode_default', 'light', 'text', 'theme'),
  ('logo_url', '/logo_easy.png', 'url', 'navigation'),
  ('site_name', 'Easy Patagonia', 'text', 'navigation'),
  ('site_tagline', 'Austral Experience', 'text', 'navigation');

-- 4. VERIFICAR QUE SE INSERTARON LOS DATOS
-- =====================================================
SELECT 'CAROUSEL' as tabla, COUNT(*) as registros FROM landing_carousel
UNION ALL
SELECT 'CONTENT' as tabla, COUNT(*) as registros FROM landing_content
UNION ALL
SELECT 'SETTINGS' as tabla, COUNT(*) as registros FROM landing_settings;

-- =====================================================
-- Deberías ver:
-- CAROUSEL  | 3
-- CONTENT   | 7
-- SETTINGS  | 14
-- =====================================================
