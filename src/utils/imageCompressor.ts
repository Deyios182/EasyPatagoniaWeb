/**
 * Compresor de imágenes en el cliente (Browser).
 * Convierte cualquier formato (PNG, JPEG, HEIC convertido) a WebP optimizado
 * con resolución máxima de 1280px y calidad ~75%.
 * Reduce fotos de 4MB-10MB a ~80KB-180KB (más del 95% de ahorro de egress).
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

export const compressImage = async (
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    format = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    // Si no es imagen, retornar tal cual
    if (file instanceof File && !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escalado proporcional
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('No se pudo obtener el contexto 2D del canvas'));
        }

        // Suavizado de imagen para mejor calidad visual tras reducción
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Fallo al generar el Blob de la imagen comprimida'));
            }

            // Generar nombre de archivo con extensión .webp
            const originalName = file instanceof File ? file.name : 'upload';
            const cleanName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const extension = format === 'image/webp' ? 'webp' : 'jpg';
            const newFileName = `${cleanName}.${extension}`;

            const compressedFile = new File([blob], newFileName, {
              type: format,
              lastModified: Date.now()
            });

            console.log(
              `⚡ [ImageCompressor] ${(file.size / 1024).toFixed(1)} KB ➔ ${(compressedFile.size / 1024).toFixed(1)} KB (-${Math.round((1 - compressedFile.size / file.size) * 100)}%)`
            );

            resolve(compressedFile);
          },
          format,
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};
