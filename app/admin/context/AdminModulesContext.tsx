'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface AdminModule {
  key: string;
  name: string;
  enabled: boolean;
  icon: string;
  category: string;
  dependencies?: string[];
  dependencyType?: 'all' | 'any';
}

interface AdminModulesContextType {
  modules: AdminModule[];
  isLoading: boolean;
  isModuleEnabled: (key: string) => boolean;
  getEnabledModules: () => AdminModule[];
}

const AdminModulesContext = createContext<AdminModulesContextType | null>(null);

export function AdminModulesProvider({ children }: { children: React.ReactNode }) {
  const modulesData = useQuery(api.admin.modules.listModules);
  
  const isLoading = modulesData === undefined;
  
  const modules = useMemo(() => {
    if (!modulesData) {return [];}
    return modulesData.map(m => ({
      category: m.category,
      dependencies: m.dependencies,
      dependencyType: m.dependencyType,
      enabled: m.enabled,
      icon: m.icon,
      key: m.key,
      name: m.name,
    }));
  }, [modulesData]);

  // Check if module is enabled AND all its dependencies are satisfied
  const isModuleEnabled = (key: string): boolean => {
    const currentModule = modules.find(m => m.key === key);
    if (!currentModule) {return false;}
    if (!currentModule.enabled) {return false;}
    
    // Check dependencies
    if (currentModule.dependencies && currentModule.dependencies.length > 0) {
      const depType = currentModule.dependencyType ?? 'all';
      
      if (depType === 'all') {
        // ALL dependencies must be enabled
        const allDepsEnabled = currentModule.dependencies.every(depKey => {
          const depModule = modules.find(m => m.key === depKey);
          return depModule?.enabled ?? false;
        });
        if (!allDepsEnabled) {return false;}
      } else {
        // ANY dependency must be enabled
        const anyDepEnabled = currentModule.dependencies.some(depKey => {
          const depModule = modules.find(m => m.key === depKey);
          return depModule?.enabled ?? false;
        });
        if (!anyDepEnabled) {return false;}
      }
    }
    
    return true;
  };

  const getEnabledModules = () => modules.filter(m => isModuleEnabled(m.key));

  return (
    <AdminModulesContext.Provider value={{ getEnabledModules, isLoading, isModuleEnabled, modules }}>
      {children}
    </AdminModulesContext.Provider>
  );
}

export function useAdminModules() {
  const context = useContext(AdminModulesContext);
  if (!context) {
    throw new Error('useAdminModules must be used within AdminModulesProvider');
  }
  return context;
}
