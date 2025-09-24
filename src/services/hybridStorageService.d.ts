// Type declarations for hybridStorageService.js
export interface HybridStorageService {
  init(): Promise<void>;
  save(data: any): Promise<boolean>;
  load(): Promise<any>;
  clearAllData(): Promise<boolean>;
  getUsageInfo(): any;
  forceSync(): Promise<boolean>;
  getSyncStatus(): any;
  isCloudSyncAvailable(): boolean;
}

declare const hybridStorageService: HybridStorageService;
export { hybridStorageService };
