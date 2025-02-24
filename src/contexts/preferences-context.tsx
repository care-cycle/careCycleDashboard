import { useState, ReactNode } from "react";
import {
  PreferencesContext,
  PreferencesContextType,
} from "./preferences-types";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Customer table state
  const [customerColumns, setCustomerColumns] = useState<string[]>([
    "customer",
    "contact",
    "location",
    "campaigns",
    "calls",
    "last-contact",
  ]);
  const [customerSearch, setCustomerSearch] = useState("");

  // Call table state
  const [showTestCalls, setShowTestCalls] = useState(false);
  const [showConnectedOnly, setShowConnectedOnly] = useState(true);
  const [callSearch, setCallSearch] = useState("");

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

export type { PreferencesContextType };
