import { supabase } from '../supabaseClient';

// --- 1. SUBIR IMAGEN ---
export const uploadImage = async (file: File, folder: string = ''): Promise<string | null> => {
  try {
    const bucketName = 'uploads'; // SIEMPRE usar el bucket uploads
    console.log('🔵 [UPLOAD] Iniciando subida de imagen...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket: bucketName,
      folder: folder
    });

    // Validar tamaño (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert('La imagen es demasiado grande. Máximo 5MB.');
      console.error('❌ [UPLOAD] Archivo muy grande:', file.size);
      return null;
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Formato de imagen no válido. Usa JPG, PNG, WEBP o GIF.');
      console.error('❌ [UPLOAD] Tipo de archivo no válido:', file.type);
      return null;
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Construir ruta con folder opcional
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log('🔵 [UPLOAD] Intentando subir a bucket:', bucketName, 'con ruta:', filePath);

    // Subir archivo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ [UPLOAD] Error de Supabase Storage:', uploadError);

      // Mensajes específicos según el error
      if (uploadError.message.includes('not found')) {
        alert(`El bucket "${bucketName}" no existe. Verifica la configuración en Supabase.`);
      } else if (uploadError.message.includes('policies')) {
        alert('Sin permisos para subir archivos. Verifica las políticas RLS del bucket.');
      } else {
        alert(`Error al subir imagen: ${uploadError.message}`);
      }
      return null;
    }

    console.log('✅ [UPLOAD] Archivo subido exitosamente:', uploadData);

    // Obtener URL pública
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('✅ [UPLOAD] URL pública generada:', data.publicUrl);
    return data.publicUrl;

  } catch (error: any) {
    console.error('❌ [UPLOAD] Error inesperado:', error);
    alert(`Error inesperado al subir imagen: ${error.message || 'Desconocido'}`);
    return null;
  }
};

// --- 2. DESCARGAR IMAGEN (Tu pregunta específica) ---
export const downloadImage = async (imageUrl: string, fileName: string = 'imagen-descargada') => {
  try {
    // 1. Pedimos la imagen como "datos crudos" (blob)
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // 2. Creamos un enlace invisible temporal
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // 3. Forzamos el nombre del archivo y la descarga
    link.setAttribute('download', fileName);
    document.body.appendChild(link);

    // 4. Hacemos "clic" automático y limpiamos
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error al descargar:', error);
  }
};
