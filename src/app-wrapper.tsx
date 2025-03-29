import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { RedactionProvider } from "@/contexts/redaction-context";
import { UIProvider } from "@/contexts/ui-context";
import { PreferencesProvider } from "@/contexts/preferences-context";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackWidget } from "@/components/ui/feedback-widget";
import ErrorBoundary from "@/components/ErrorBoundary";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 403 errors
        if (error?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export function AppWrapper() {
  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error("Missing Clerk Publishable Key");
  }

  return (
    <StrictMode>
      <ErrorBoundary>
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignOutUrl="/sign-in"
          signInFallbackRedirectUrl="/dashboard"
        >
          <QueryClientProvider client={queryClient}>
            <BrowserRouter
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <RedactionProvider>
                <UIProvider>
                  <PreferencesProvider>
                    <App />
                    <Toaster />
                    <FeedbackWidget />
                  </PreferencesProvider>
                </UIProvider>
              </RedactionProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </ClerkProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
