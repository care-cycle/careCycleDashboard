import { createContext } from "react";

export interface RedactionContextType {
  isRedacted: boolean;
  setIsRedacted: (value: boolean) => void;
}

export const RedactionContext = createContext<RedactionContextType | undefined>(
  undefined,
);
