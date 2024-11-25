export interface WalletCredentials {
    encoded: string;
    encoding: {
      content: string[];
      type: string[];
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
    WALLET_CREDS: string|null;
    CERE_BUCKET_ID: number|null;
    CERE_CLUSTER_ID: string|null;
    CERE_FOLDER: string|null;
    CERE_PASSPHRASE: string|null;
  }
  
  export enum RunnerMode {
    AcurastNetwork,
    LocalDevelopment,
  }