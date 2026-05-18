import React, { createContext, useContext, useState, ReactNode } from "react";
import type { PrescriptionAnalysis } from "@workspace/api-client-react/src/generated/api.schemas";

interface PrescriptionContextType {
  analysisResult: PrescriptionAnalysis | null;
  setAnalysisResult: (result: PrescriptionAnalysis | null) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

export function PrescriptionProvider({ children }: { children: ReactNode }) {
  const [analysisResult, setAnalysisResult] = useState<PrescriptionAnalysis | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");

  return (
    <PrescriptionContext.Provider value={{ analysisResult, setAnalysisResult, selectedLanguage, setSelectedLanguage }}>
      {children}
    </PrescriptionContext.Provider>
  );
}

export function usePrescription() {
  const context = useContext(PrescriptionContext);
  if (context === undefined) {
    throw new Error("usePrescription must be used within a PrescriptionProvider");
  }
  return context;
}
