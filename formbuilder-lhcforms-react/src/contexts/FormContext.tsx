import React, { createContext, useContext, useState, useCallback } from 'react';

interface FormContextType {
  announceError: (message: string) => void;
  clearError: () => void;
  error: string | null;
}

const FormContext = createContext<FormContextType>({
  announceError: () => {},
  clearError: () => {},
  error: null,
});

export const useFormContext = () => useContext(FormContext);

interface FormProviderProps {
  children: React.ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  const announceError = useCallback((message: string) => {
    setError(message);
    // Optional: Use browser's native accessibility API
    if (typeof window !== 'undefined' && 'LiveAnnouncer' in window) {
      // @ts-ignore
      window.LiveAnnouncer.announce(message);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    announceError,
    clearError,
    error,
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};