import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RedactionContextType {
  isRedacted: boolean;
  setIsRedacted: (value: boolean) => void;
}

const RedactionContext = createContext<RedactionContextType | undefined>(undefined);

export function RedactionProvider({ children }: { children: ReactNode }) {
  const [isRedacted, setIsRedacted] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'r' && event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIsRedacted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <RedactionContext.Provider value={{ isRedacted, setIsRedacted }}>
      {children}
    </RedactionContext.Provider>
  );
}

export function useRedaction() {
  const context = useContext(RedactionContext);
  if (context === undefined) {
    throw new Error('useRedaction must be used within a RedactionProvider');
  }
  return context;
} 