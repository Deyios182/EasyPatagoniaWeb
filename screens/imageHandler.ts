import { supabase } from '../supabaseClient';
import { compressImage } from '../src/utils/imageCompressor';

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

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Formato de imagen no válido. Usa JPG, PNG, WEBP o GIF.');
      console.error('❌ [UPLOAD] Tipo de archivo no válido:', file.type);
      return null;
    }

    // ⚡ COMPRESIÓN AUTOMÁTICA EN EL NAVEGADOR ANTES DE SUBIR
    // Convierte a WebP optimizado (max 1280px, 75% calidad), reduciendo ~95% el tamaño
    let fileToUpload: File = file;
    try {
      fileToUpload = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.75, format: 'image/webp' });
    } catch (compressErr) {
      console.warn('⚠️ [UPLOAD] No se pudo comprimir la imagen, subiendo original:', compressErr);
    }

    // Generar nombre único con extensión .webp
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

    // Construir ruta con folder opcional
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log('🔵 [UPLOAD] Subiendo archivo optimizado a bucket:', bucketName, 'con ruta:', filePath, `(${Math.round(fileToUpload.size / 1024)} KB)`);

    // Subir archivo con caché de 1 año (inmutable)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileToUpload, {
        cacheControl: '31536000', // 1 año de caché
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
