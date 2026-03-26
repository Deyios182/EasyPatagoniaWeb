-- Añadir una columna de "rating" (1 a 5) a community_posts para las reseñas de negocios
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
