// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { AnimatePresence } from "framer-motion";
import { VerifyEmail } from "./pages/sign-up/verify-email";
import SignUpPage from "./pages/sign-up";
import Dashboard from "./pages/dashboard";
import Calls from "./pages/calls";
import SignIn from "./pages/sign-in";
import ProfilePage from "./pages/user/profile";
import BillingPage from "./pages/user/billing";
import { useInitialData } from "./hooks/use-client-data";
import Customers from "./pages/customers";
import CampaignsPage from "./pages/campaigns";
import Appointments from "./pages/appointments";
import InquiriesPage from "./pages/inquiries";
import SourcesPage from "./pages/sources";
import ManageSourcesPage from "./pages/sources/manage";
import { AdminRoute } from "./components/auth/admin-route";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UnauthorizedPage } from "./pages/unauthorized";

export function App() {
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
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected routes - including default redirects */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/user/profile" element={<ProfilePage />} />
          <Route
            path="/user/billing"
            element={
              <AdminRoute>
                <BillingPage />
              </AdminRoute>
            }
          />
          <Route path="/customers" element={<Customers />} />
          <Route
            path="/campaigns"
            element={
              <AdminRoute>
                <CampaignsPage />
              </AdminRoute>
            }
          />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route
            path="/sources"
            element={
              <AdminRoute>
                <SourcesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/sources/manage"
            element={
              <AdminRoute>
                <ManageSourcesPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
