// Type declarations for apiKeyService.js
export interface ApiKeyService {
  validateKey(key: string): boolean;
  setKey(keyName: string, key: string): void;
  getKey(keyName: string): string | null;
  getApiKey(keyName: string): string | null;
  removeKey(keyName: string): void;
  isConfigured(keyName: string): boolean;
  init(): void;
  getStatus(): any;
}

declare const apiKeyService: ApiKeyService;
export { apiKeyService };
