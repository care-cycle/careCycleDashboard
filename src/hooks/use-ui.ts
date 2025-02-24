import { useContext } from "react";
import { UIContext } from "../contexts/ui-types";

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
