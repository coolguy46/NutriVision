import { useState } from 'react';
import { FoodData } from '@/components/types';

export function useAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<FoodData | null>(null);

  return {
    analysisResult,
    setAnalysisResult
  };
}