import { supabase } from '../supabaseClient';

// --- 1. SUBIR IMAGEN ---
export const uploadImage = async (file: File, bucketName: string = 'uploads'): Promise<string | null> => {
  try {
    // Generamos un nombre único para que no se sobrescriban
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Subimos el archivo al "Bucket" de Supabase
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error subiendo:', uploadError);
      return null;
    }

    // Obtenemos la URL pública para usarla después
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;

  } catch (error) {
    console.error('Error:', error);
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
