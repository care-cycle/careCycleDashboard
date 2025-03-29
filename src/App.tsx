// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { UIProvider } from "./contexts/ui-context";
import { AnimatePresence } from "framer-motion";
import { RedactionProvider } from "./contexts/redaction-context";
import { PrivateRoute } from "./components/auth/private-route";
import { AdminRoute } from "./components/auth/admin-route";
import { VerifyEmail } from "./pages/sign-up/verify-email";
import SignUpPage from "./pages/sign-up";
import Dashboard from "./pages/dashboard";
import Calls from "./pages/calls";
import SignIn from "./pages/sign-in";
import ProfilePage from "./pages/user/profile";
import BillingPage from "./pages/user/billing";
import { useInitialData } from "./hooks/use-client-data";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Customers from "./pages/customers";
import CampaignsPage from "./pages/campaigns";
import Appointments from "./pages/appointments";
import InquiriesPage from "./pages/inquiries";
import SourcesPage from "./pages/sources";
import ManageSourcesPage from "./pages/sources/manage";
import { FeedbackWidget } from "./components/ui/feedback-widget";
import { PreferencesProvider } from "@/contexts/preferences-context";
import ErrorBoundary from "./components/ErrorBoundary";

// Create a client
const queryClient = new QueryClient();

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoading: isLoadingInitialData } = useInitialData();

  // Only show loading if auth is still loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-6 rounded-lg">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  // If we're signed in and loading initial data, show loading
  if (isSignedIn && isLoadingInitialData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-6 rounded-lg">
          <div className="animate-pulse">Loading your data...</div>
        </div>
      </div>
    );
  }

  return (
    <UIProvider>
      <PreferencesProvider>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Root redirect */}
            <Route
              path="/"
              element={
                isSignedIn ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/sign-in" replace />
                )
              }
            />

            {/* Dashboard route */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Public Routes */}
            <Route path="/sign-in/*" element={<SignIn />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Private Routes */}
            <Route
              path="/calls"
              element={
                <PrivateRoute>
                  <Calls />
                </PrivateRoute>
              }
            />
            <Route
              path="/user/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/user/billing"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <BillingPage />
                  </AdminRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <PrivateRoute>
                  <Customers />
                </PrivateRoute>
              }
            />
            <Route
              path="/campaigns"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <CampaignsPage />
                  </AdminRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <PrivateRoute>
                  <Appointments />
                </PrivateRoute>
              }
            />
            <Route
              path="/inquiries"
              element={
                <PrivateRoute>
                  <InquiriesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/sources"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <SourcesPage />
                  </AdminRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/sources/manage"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <ManageSourcesPage />
                  </AdminRoute>
                </PrivateRoute>
              }
            />

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </PreferencesProvider>
    </UIProvider>
  );
}

// Main App component
export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RedactionProvider>
          <App />
          <FeedbackWidget />
        </RedactionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
