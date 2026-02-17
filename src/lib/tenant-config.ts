"use client";

// Global tenant configuration storage
let globalTenantConfig: {
  n8nWebhookUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
} | null = null;

export const setGlobalTenantConfig = (config: typeof globalTenantConfig) => {
  globalTenantConfig = config;
  console.log('🌍 Global tenant config set:', config);
};

export const getTenantConfig = (): typeof globalTenantConfig => {
  return globalTenantConfig;
};

export const clearGlobalTenantConfig = () => {
  globalTenantConfig = null;
};