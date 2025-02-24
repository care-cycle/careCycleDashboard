import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import { RedactionProvider } from "@/contexts/redaction-context";
import { UIProvider } from "@/contexts/ui-context";
import { PreferencesProvider } from "@/contexts/preferences-context";
import { Toaster } from "@/components/ui/sonner";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AppWrapper() {
  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error("Missing Clerk Publishable Key");
  }

  return (
    <StrictMode>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        afterSignOutUrl="/sign-in"
        signInFallbackRedirectUrl="/dashboard"
      >
        <RedactionProvider>
          <UIProvider>
            <PreferencesProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
              <Toaster />
            </PreferencesProvider>
          </UIProvider>
        </RedactionProvider>
      </ClerkProvider>
    </StrictMode>
  );
}
