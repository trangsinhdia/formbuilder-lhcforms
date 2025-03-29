import React, { createContext, useContext, useRef } from 'react';
import { FormService, FormServiceContext } from '../services/FormService';

interface FormServiceProviderProps {
  children: React.ReactNode;
}

export const FormServiceProvider: React.FC<FormServiceProviderProps> = ({ children }) => {
  const formServiceRef = useRef<FormService | null>(null);
  
  if (!formServiceRef.current) {
    formServiceRef.current = new FormService();
  }

  return (
    <FormServiceContext.Provider value={formServiceRef.current}>
      {children}
    </FormServiceContext.Provider>
  );
};