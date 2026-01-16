-- FIX: Error "no unique or exclusion constraint matching the ON CONFLICT"
-- Problema: La base de datos no sabe que 'order_position' debe ser único, por eso falla el 'upsert'.

-- 1. Limpiar la tabla actual para evitar errores de duplicados existentes
-- (Esto borrará las imágenes actuales del carrusel para empezar limpio)
TRUNCATE TABLE landing_carousel;

-- 2. Agregar la restricción de que la posición (1, 2, 3) sea ÚNICA
ALTER TABLE landing_carousel 
ADD CONSTRAINT landing_carousel_order_position_key UNIQUE (order_position);

-- 3. Insertar datos por defecto (opcional, para que no quede vacía)
INSERT INTO landing_carousel (image_url, order_position, alt_text) VALUES
  ('https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070', 1, 'Patagonia Default 1'),
  ('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000', 2, 'Patagonia Default 2'),
  ('https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074', 3, 'Patagonia Default 3');
