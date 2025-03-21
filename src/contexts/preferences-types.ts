import { createContext } from "react";

export interface PreferencesContextType {
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

  // Campaign selection
  selectedCampaignId: string;
  setSelectedCampaignId: (id: string) => void;
}

export const PreferencesContext = createContext<
  PreferencesContextType | undefined
>(undefined);
