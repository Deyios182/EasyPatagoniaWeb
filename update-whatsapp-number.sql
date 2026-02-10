-- =====================================================
-- ACTUALIZAR NÚMERO DE WHATSAPP EN PRODUCCIÓN
-- =====================================================
-- Este script actualiza el número de WhatsApp de contacto
-- De: +56 9 5642 5005 (56956425005)
-- A:  +56 9 9305 9789 (56993059789)
-- =====================================================

UPDATE landing_settings 
SET value = '56993059789' 
WHERE key = 'contact_whatsapp';

-- Verificar el cambio
SELECT key, value FROM landing_settings WHERE key = 'contact_whatsapp';
