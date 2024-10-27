"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FoodData } from '@/components/types';

// Define the context type
interface AnalysisContextType {
  analysisResult: FoodData | null;
  setAnalysisResult: React.Dispatch<React.SetStateAction<FoodData | null>>;
}

// Create the context with a default value
const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

// Create a provider component
export const AnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [analysisResult, setAnalysisResult] = useState<FoodData | null>(null);

  return (
    <AnalysisContext.Provider value={{ analysisResult, setAnalysisResult }}>
      {children}
    </AnalysisContext.Provider>
  );
};

// Custom hook to use the context
export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
