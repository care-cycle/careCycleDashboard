import { createContext, useContext, useState, ReactNode } from 'react';

interface PreferencesContextType {
  // Customer table preferences
  customerColumns: string[];
  setCustomerColumns: (columns: string[]) => void;
  customerSearch: string;
  setCustomerSearch: (search: string) => void;
  
  // Call table preferences
  showTestCalls: boolean;
  setShowTestCalls: (show: boolean) => void;
  showConnectedOnly: boolean;
  setShowConnectedOnly: (show: boolean) => void;
  callSearch: string;
  setCallSearch: (search: string) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Customer table state
  const [customerColumns, setCustomerColumns] = useState<string[]>([
    'customer', 'contact', 'location', 'campaigns', 'calls', 'last-contact'
  ]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Call table state
  const [showTestCalls, setShowTestCalls] = useState(false);
  const [showConnectedOnly, setShowConnectedOnly] = useState(true);
  const [callSearch, setCallSearch] = useState('');

  return (
    <PreferencesContext.Provider
      value={{
        customerColumns,
        setCustomerColumns,
        customerSearch,
        setCustomerSearch,
        showTestCalls,
        setShowTestCalls,
        showConnectedOnly,
        setShowConnectedOnly,
        callSearch,
        setCallSearch,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
} 