import { useContext } from "react";
import { RedactionContext } from "../contexts/redaction-types";

export function useRedaction() {
  const context = useContext(RedactionContext);
  if (context === undefined) {
    throw new Error("useRedaction must be used within a RedactionProvider");
  }
  return context;
}
