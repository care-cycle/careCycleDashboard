import { createContext } from "react";

export interface UIContextType {
  isCallDetailsOpen: boolean;
  setCallDetailsOpen: (open: boolean) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);
