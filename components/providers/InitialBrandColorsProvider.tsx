'use client';

import React, { createContext, useContext } from 'react';

type BrandMode = 'single' | 'dual';

type InitialBrandColors = {
  primary: string;
  secondary: string;
  mode: BrandMode;
};

const InitialBrandColorsContext = createContext<InitialBrandColors | null>(null);

export function InitialBrandColorsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: InitialBrandColors;
}) {
  return (
    <InitialBrandColorsContext.Provider value={value}>
      {children}
    </InitialBrandColorsContext.Provider>
  );
}

export function useInitialBrandColors() {
  return useContext(InitialBrandColorsContext);
}
