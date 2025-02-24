import { useState } from "react";
import { UIContext, UIContextType } from "./ui-types";

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isCallDetailsOpen, setCallDetailsOpen] = useState(false);

  return (
    <UIContext.Provider value={{ isCallDetailsOpen, setCallDetailsOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export type { UIContextType };
