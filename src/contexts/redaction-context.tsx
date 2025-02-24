import { useState, useEffect, ReactNode } from "react";
import { RedactionContext, RedactionContextType } from "./redaction-types";

export function RedactionProvider({ children }: { children: ReactNode }) {
  const [isRedacted, setIsRedacted] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "r" && event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIsRedacted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <RedactionContext.Provider value={{ isRedacted, setIsRedacted }}>
      {children}
    </RedactionContext.Provider>
  );
}

export type { RedactionContextType };
