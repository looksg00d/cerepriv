import { DdcClient, File as DdcFile, MAINNET, FileUri, FileResponse } from '@cere-ddc-sdk/ddc-client';
import { JsonSigner } from '@cere-ddc-sdk/blockchain';
import { KeyringPair$Json } from '@polkadot/keyring/types';
import { ddcConfig } from '../../config/ddc.config';
import { keyData } from '../../config/keys.config';

let ddcClient: DdcClient | null = null;

// Используем тип из библиотеки
type SignerOptions = {
  passphrase: string;
};

const signerOptions: SignerOptions = {
  passphrase: "11111111"
};

interface UploadResult {
  cid: string;
  bucketId: string;
  originalName: string;
}

interface FileMetadata {
  originalName: string;
  contentType: string;
}

export async function initializeDDC(): Promise<DdcClient> {
  if (!ddcClient) {
    try {
      const keyringJson = keyData as KeyringPair$Json;
      const signer = new JsonSigner(keyringJson, signerOptions);
      
      await signer.isReady();
      
      console.log("Signer initialized successfully");
      
      ddcClient = await DdcClient.create(signer, {
        ...MAINNET,
        logLevel: 'debug'
      });

      console.log("DDC Client initialized successfully");
      
      const balance = await ddcClient.getBalance();
      console.log("Account balance:", balance.toString());
      
    } catch (error) {
      console.error("Failed to initialize DDC client:", error);
      throw error;
    }
  }
  return ddcClient;
}

export async function uploadFile(buffer: Buffer): Promise<UploadResult> {
  try {
    const client = await initializeDDC();
    const uint8Array = new Uint8Array(buffer);
    const ddcFile = new DdcFile(uint8Array);

    const result = await client.store(
      BigInt(ddcConfig.bucketId),
      ddcFile
    );
    
    return {
      cid: result.cid,
      bucketId: ddcConfig.bucketId,
      originalName: 'original.heic'
    };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
}

export async function uploadBuffer(buffer: Buffer, filename: string): Promise<UploadResult> {
  try {
    const client = await initializeDDC();
    const uint8Array = new Uint8Array(buffer);
    const ddcFile = new DdcFile(uint8Array);

    const result = await client.store(
      BigInt(ddcConfig.bucketId),
      ddcFile
    );
    
    return {
      cid: result.cid,
      bucketId: ddcConfig.bucketId,
      originalName: filename
    };
  } catch (error) {
    console.error('Error in uploadBuffer:', error);
    throw error;
  }
}

export async function readFile(cid: string, bucketId: string): Promise<FileResponse> {
  try {
    const client = await initializeDDC();
    const fileUri: FileUri = { 
      bucketId: BigInt(bucketId),
      cid: cid,
      cidOrName: cid,
      entity: 'file'
    };
    const fileResponse = await client.read(fileUri);
    return fileResponse;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}

export async function downloadFile(cid: string, bucketId: string, fileName: string): Promise<void> {
  try {
    const client = await initializeDDC();
    
    const fileUri: FileUri = {
      bucketId: BigInt(bucketId),
      cid: cid,
      cidOrName: cid,
      entity: 'file'
    };

    console.log('Attempting to download file with params:', fileUri);
    
    const response = await client.read(fileUri);
    
    if (!response) {
      throw new Error('No response received from DDC');
    }

    // Получаем данные как ArrayBuffer
    const data = await response.arrayBuffer();
    
    // Создаем blob из данных
    const blob = new Blob([data], { type: 'image/heic' });
    
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('File downloaded successfully:', fileName);
  } catch (error) {
    console.error('Error in downloadFile:', {
      cid,
      bucketId,
      fileName,
      error
    });
    throw error;
  }
}

export const getFileUrlByName = (
  bucketId: string, 
  cnsName: string, 
  fileName: string
): string => {
  return [ddcConfig.baseUrl, bucketId, cnsName, fileName].filter(Boolean).join('/');
};

export const getFileUrlByCid = (
  bucketId: string, 
  cid: string
): string => {
  return [ddcConfig.baseUrl, bucketId, cid].filter(Boolean).join('/');
};