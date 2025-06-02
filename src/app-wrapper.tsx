import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { UnifiedAuthProvider } from "./providers/auth";
import { UserProvider } from "./providers/user-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { RedactionProvider } from "@/contexts/redaction-context";
import { UIProvider } from "@/contexts/ui-context";
import { PreferencesProvider } from "@/contexts/preferences-context";
import { Toaster } from "@/components/ui/sonner";
import { FeedbackWidget } from "@/components/ui/feedback-widget";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
    },
  },
});

export function AppWrapper() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <UnifiedAuthProvider>
          <QueryClientProvider client={queryClient}>
            <UserProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
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
            </UserProvider>
          </QueryClientProvider>
        </UnifiedAuthProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
