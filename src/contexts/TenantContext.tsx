"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, TenantUser } from './AuthContext';

interface TenantContextType {
  currentTenant: TenantUser | null;
  getTenantConfig: () => {
    n8nWebhookUrl: string;
    supabaseUrl: string;
    supabaseKey: string;
  } | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const getTenantConfig = () => {
    if (!user || user.isAdmin) return null;
    
    return {
      n8nWebhookUrl: user.n8nWebhookUrl,
      supabaseUrl: user.supabaseUrl,
      supabaseKey: user.supabaseKey,
    };
  };

  return (
    <TenantContext.Provider value={{
      currentTenant: user,
      getTenantConfig,
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};