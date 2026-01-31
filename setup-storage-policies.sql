-- =====================================================
-- POLÍTICAS DE STORAGE PARA BUCKET attraction-photos
-- =====================================================

-- Permitir que CUALQUIERA pueda SUBIR fotos (INSERT)
CREATE POLICY "Anyone can upload attraction photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'attraction-photos');

-- Permitir que CUALQUIERA pueda VER fotos (SELECT)
CREATE POLICY "Anyone can view attraction photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attraction-photos');

-- Permitir que usuarios autenticados puedan ACTUALIZAR sus propias fotos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'attraction-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir que usuarios autenticados puedan ELIMINAR sus propias fotos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attraction-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- VERIFICACIÓN: Ver políticas actuales
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%attraction%';
