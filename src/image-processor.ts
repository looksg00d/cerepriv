import { uploadBuffer } from './services/ddc/ddc-client';
const convert = require("heic-convert");

export const processImage = async (identifier: string, inputBuffer: Buffer): Promise<Buffer> => {
  try {
    const images = await convert.all({
      buffer: inputBuffer,
      format: 'PNG'
    });

    const image = images[0];
    const pngBuffer = await image.convert();
    
    // Загружаем в Cere DDC
    const result = await uploadBuffer(pngBuffer, `${identifier}.png`);
    
    // Возвращаем только буфер
    return pngBuffer; // Возвращаем буфер для дальнейшей загрузки
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};