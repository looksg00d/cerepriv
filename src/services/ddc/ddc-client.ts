import { DdcClient, JsonSigner, MAINNET } from '@cere-ddc-sdk/ddc-client';
import { EncryptedJsonEncoding } from 'модуль-с-EncryptedJsonEncoding';

let ddcClient: DdcClient | null = null;

const PASSWORD = "11111111";

export interface WalletCredentials {
  encoded: string;
  encoding: {
    content: string[];
    type: EncryptedJsonEncoding | EncryptedJsonEncoding[];
    version: string;
  };
  address: string;
  meta: any;
}

export interface InitServerData {
  env: Environ;
  envType: RunnerMode;
}

export interface Environ {
  WALLET_CREDS: string | null;
  CERE_BUCKET_ID: string | null; // Изменен тип на string для BigInt
  CERE_CLUSTER_ID: string | null;
  CERE_FOLDER: string | null;
  CERE_PASSPHRASE: string | null;
}

export enum RunnerMode {
  AcurastNetwork,
  LocalDevelopment,
}

export async function initStorageClient(
  initializer: InitServerData
): Promise<DdcClient> {
  if (!initializer.env.WALLET_CREDS || !initializer.env.CERE_PASSPHRASE || !initializer.env.CERE_BUCKET_ID) {
    throw new Error('Необходимо задать WALLET_CREDS, CERE_PASSPHRASE и CERE_BUCKET_ID');
  }

  const walletCreds: WalletCredentials = JSON.parse(initializer.env.WALLET_CREDS);
  
  const jsonSigner = new JsonSigner(walletCreds, {
    passphrase: initializer.env.CERE_PASSPHRASE,
  });

  const signOK = await jsonSigner.isReady();
  console.debug(`Signer is ready: ${signOK} with address: ${jsonSigner.address}`);

  const client = await DdcClient.create(jsonSigner, MAINNET);
  await client.getBucket(BigInt(initializer.env.CERE_BUCKET_ID));

  return client;
}