"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '@/lib/supabase';

interface RoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isAdmin: boolean;
  isViewer: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole>('admin');

  return (
    <RoleContext.Provider value={{
      userRole,
      setUserRole,
      isAdmin: userRole === 'admin',
      isViewer: userRole === 'viewer'
    }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};