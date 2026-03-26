-- Añadir columna link_url para guardar enlace de YouTube, TikTok, Reels, etc.
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS link_url TEXT;
