-- =====================================================
-- SCRIPT: Setup Landing Page Dynamic System
-- Descripción: Crea tablas y datos iniciales para landing page editable
-- =====================================================

-- 1. CREAR TABLA PARA CARRUSEL HERO (3 imágenes)
-- =====================================================
CREATE TABLE IF NOT EXISTS landing_carousel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  order_position INTEGER NOT NULL UNIQUE,
  alt_text TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREAR/VERIFICAR TABLA LANDING_CONTENT
-- =====================================================
CREATE TABLE IF NOT EXISTS landing_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  title TEXT,
  subtitle TEXT,
  body TEXT,
  image_url TEXT,
  button_text TEXT,
  button_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREAR/VERIFICAR TABLA LANDING_SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS landing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. POBLAR CARRUSEL HERO CON 3 IMÁGENES POR DEFECTO
-- =====================================================
INSERT INTO landing_carousel (image_url, order_position, alt_text) VALUES
  ('https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070', 1, 'Patagonia Landscape 1'),
  ('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000', 2, 'Patagonia Mountain Vista'),
  ('https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074', 3, 'Patagonia Nature')
ON CONFLICT DO NOTHING;

-- 5. POBLAR LANDING_CONTENT CON CONTENIDO ACTUAL
-- =====================================================
INSERT INTO landing_content (key, title, subtitle, body, image_url) VALUES
  -- HERO
  ('hero', 'Patagonia Sin Límites', 'Menos planificación. Más Patagonia.', NULL, 'https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070'),
  
  -- VISIÓN
  ('vision', 'Nuestra Visión', NULL, 'Convertirnos en la plataforma turística líder de toda la Patagonia —chilena y argentina— integrando tecnología, sostenibilidad y desarrollo comunitario.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000'),
  
  ('mission', 'Nuestra Misión', NULL, 'Impulsar el desarrollo turístico de la Región de Aysén mediante una plataforma innovadora que conecta a viajeros con experiencias auténticas, la naturaleza y las comunidades locales.', NULL),
  
  -- PILARES
  ('pillar_1', 'Conexión y Autenticidad', NULL, 'Ser la plataforma líder que conecta a los viajeros con experiencias auténticas.', NULL),
  ('pillar_2', 'Planificación Simple', NULL, 'Soluciones innovadoras para simplificar tu viaje: hospedaje, gastronomía y tours.', NULL),
  ('pillar_3', 'Turismo Sostenible', NULL, 'Promover un turismo responsable que respeta la riqueza natural de la Patagonia.', NULL),
  
  -- CONTACTO
  ('contact_section', '¡Únete a la Aventura EasyPatagonia!', 'Síguenos en nuestras plataformas para no perderte ninguna novedad.', NULL, NULL)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  body = EXCLUDED.body,
  image_url = EXCLUDED.image_url,
  updated_at = now();

-- 6. POBLAR LANDING_SETTINGS CON CONFIGURACIÓN
-- =====================================================
INSERT INTO landing_settings (key, value, type, category) VALUES
  -- CONTACTO
  ('contact_whatsapp', '56993059789', 'text', 'contact'),
  ('contact_email', 'infoeasypatagonia@gmail.com', 'email', 'contact'),
  ('contact_address', 'Puerto Río Tranquilo, Aysén', 'text', 'contact'),
  
  -- REDES SOCIALES
  ('social_instagram', 'https://www.instagram.com/easy.patagonia', 'url', 'social'),
  ('social_tiktok', 'https://www.tiktok.com/@easy.patagonia?_t=ZM-8srRmTRFV1q&_r=1', 'url', 'social'),
  ('social_facebook', '', 'url', 'social'),
  
  -- TEMA
  ('color_primary', '#dd6e42', 'color', 'theme'),
  ('color_secondary', '#4f6d7a', 'color', 'theme'),
  ('color_accent', '#e8dab2', 'color', 'theme'),
  ('color_background', '#eaeaea', 'color', 'theme'),
  ('theme_mode_default', 'light', 'text', 'theme'),
  
  -- NAVEGACIÓN
  ('logo_url', '/logo_easy.png', 'url', 'navigation'),
  ('site_name', 'Easy Patagonia', 'text', 'navigation'),
  ('site_tagline', 'Austral Experience', 'text', 'navigation')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- 7. CONFIGURAR RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE landing_carousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_settings ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos pueden leer
DROP POLICY IF EXISTS "Public can view carousel" ON landing_carousel;
CREATE POLICY "Public can view carousel" ON landing_carousel FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view content" ON landing_content;
CREATE POLICY "Public can view content" ON landing_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view settings" ON landing_settings;
CREATE POLICY "Public can view settings" ON landing_settings FOR SELECT USING (true);

-- Políticas: Solo super_admin puede editar
DROP POLICY IF EXISTS "Super admin can manage carousel" ON landing_carousel;
CREATE POLICY "Super admin can manage carousel" ON landing_carousel FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Super admin can manage content" ON landing_content;
CREATE POLICY "Super admin can manage content" ON landing_content FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Super admin can manage settings" ON landing_settings;
CREATE POLICY "Super admin can manage settings" ON landing_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- 8. CREAR FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_landing_carousel_updated_at ON landing_carousel;
CREATE TRIGGER update_landing_carousel_updated_at BEFORE UPDATE ON landing_carousel
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_landing_content_updated_at ON landing_content;
CREATE TRIGGER update_landing_content_updated_at BEFORE UPDATE ON landing_content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_landing_settings_updated_at ON landing_settings;
CREATE TRIGGER update_landing_settings_updated_at BEFORE UPDATE ON landing_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
