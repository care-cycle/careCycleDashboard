// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useUser, getAuthProviderName } from "./providers/auth";
import { useUserData } from "./providers/user-context";
import { AnimatePresence } from "framer-motion";
import { VerifyEmail } from "./pages/sign-up/verify-email";
import SignUpPage from "./pages/sign-up";
import SignIn from "./pages/sign-in";
import Dashboard from "./pages/dashboard";
import Calls from "./pages/calls";
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
import InquiryDetailPage from "./pages/inquiries/inquiry-detail";
import { NpnRequired } from "./components/auth/npn-required";

export function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const user = useUser();
  const { userData, isLoading: isLoadingUserData } = useUserData();
  const { isLoading: isLoadingInitialData } = useInitialData();
  const authProvider = getAuthProviderName();

  // Get user role and NPN from backend database ONLY
  // We don't care about Clerk's metadata - only what's in our database
  const userRole = userData?.role || null;
  const userNpn = userData?.npn || null;

  // Log if Clerk has different data (for debugging)
  if (import.meta.env.DEV && userData && user) {
    if (user.role && userData.role !== user.role) {
      console.warn("Clerk has different role than database:", {
        database: userData.role,
        clerk: user.role,
        using: userRole,
      });
    }
    if (user.npn && userData.npn !== user.npn) {
      console.warn("Clerk has different NPN than database:", {
        database: userData.npn,
        clerk: user.npn,
        using: userNpn,
      });
    }
  }

  const isAgent = userRole === "agent";

  // Special handling for Tesseral - show minimal loading while it determines auth
  if (!isLoaded && authProvider === "tesseral") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          {/* Minimal loading - Tesseral will redirect if not authenticated */}
        </div>
      </div>
    );
  }

  // Only show loading if auth or user data is still loading
  if (!isLoaded || isLoadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-6 rounded-lg">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  // Debug logging for production
  if (import.meta.env.PROD) {
    console.log("[App] Production Debug:", {
      isSignedIn,
      userRole,
      userNpn,
      userData,
      isLoadingUserData,
    });
  }

  // IMPORTANT: Only check role if we have userData loaded
  // In production, don't make role decisions until userData is available
  if (isSignedIn && !userData && !isLoadingUserData) {
    console.error(
      "[App] Signed in but no userData available - this should not happen",
    );
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-6 rounded-lg">
          <div className="text-red-500">
            Error loading user data. Please refresh.
          </div>
        </div>
      </div>
    );
  }

  // Check if user is an agent without NPN - ONLY after userData is loaded
  const isAgentWithoutNpn =
    isSignedIn && userData && userRole === "agent" && !userNpn;

  // If user is signed in as an agent without NPN, show NPN required page immediately
  if (isAgentWithoutNpn) {
    return <NpnRequired />;
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
    <>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Auth Routes - Only render for Clerk */}
          {authProvider === "clerk" && (
            <>
              <Route path="/sign-in/*" element={<SignIn />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
            </>
          )}

          {/* Redirect auth routes to home for Tesseral */}
          {authProvider === "tesseral" && (
            <>
              <Route path="/sign-in/*" element={<Navigate to="/" replace />} />
              <Route path="/sign-up/*" element={<Navigate to="/" replace />} />
            </>
          )}

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Wait for userData before making routing decisions */}
            {!userData ? (
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="glass-panel p-6 rounded-lg">
                      <div className="animate-pulse">Loading user data...</div>
                    </div>
                  </div>
                }
              />
            ) : isAgent ? (
              <>
                <Route
                  path="/"
                  element={<Navigate to="/inquiries" replace />}
                />
                <Route
                  path="/dashboard"
                  element={<Navigate to="/inquiries" replace />}
                />

                {/* Agent accessible pages */}
                <Route path="/inquiries" element={<InquiriesPage />} />
                <Route path="/inquiries/:id" element={<InquiryDetailPage />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/calls" element={<Calls />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/user/profile" element={<ProfilePage />} />

                {/* Redirect all other routes to inquiries for agents */}
                <Route
                  path="*"
                  element={<Navigate to="/inquiries" replace />}
                />
              </>
            ) : (
              <>
                {/* Regular user routes */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
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
                <Route path="/inquiries/:id" element={<InquiryDetailPage />} />
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
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </>
            )}
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}
