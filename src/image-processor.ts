import { existsSync, mkdirSync, writeFile } from "fs";
import { promisify } from "util";
import { uploadBuffer } from './ddc-client';
const convert = require("heic-convert");

export const processImage = async (identifier: string, inputBuffer: Buffer) => {
  try {
    const images = await convert.all({
      buffer: inputBuffer,
      format: 'PNG'
    });

    const image = images[0];
    const pngBuffer = await image.convert();
    
    // Загружаем в Cere DDC
    const result = await uploadBuffer(pngBuffer, `${identifier}.png`);
    
    return {
      success: true,
      url: result.url,
      cid: result.cid
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};
