import React, { createContext, useContext, ReactNode } from 'react';
import { useAsync } from 'react-use';
import { llm } from '@grafana/llm';

interface ContextType {
  isLLMEnabled: boolean;
  isLoading: boolean;
}

const Context = createContext<ContextType | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export function ContextProvider({ children }: ProviderProps) {
  const llmEnabledState = useAsync(() => llm.enabled(), []);

  const value: ContextType = {
    isLLMEnabled: llmEnabledState.value ?? false,
    isLoading: llmEnabledState.loading,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePluginContext(): ContextType {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('usePluginContext must be used within an PluginContextProvider');
  }
  return context;
}
