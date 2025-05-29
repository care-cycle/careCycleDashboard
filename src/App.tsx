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
import InquiryDetailPage from "./pages/inquiries/inquiry-detail";
import { NpnRequired } from "./components/auth/npn-required";
import { useEffect, useState } from "react";
import apiClient from "./lib/api-client";

export function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoading: isLoadingInitialData } = useInitialData();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userNpn, setUserNpn] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  // Check user role and NPN when signed in
  useEffect(() => {
    const checkUserData = async () => {
      console.log("[App] checkUserData called, isSignedIn:", isSignedIn);

      if (!isSignedIn) {
        setCheckingUser(false);
        return;
      }

      try {
        const response = await apiClient.get("/portal/me");
        const userData = response.data;
        console.log("[App] User data from /portal/me:", userData);
        setUserRole(userData.role);
        setUserNpn(userData.npn);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setCheckingUser(false);
      }
    };

    if (isLoaded) {
      checkUserData();
    }
  }, [isLoaded, isSignedIn]);

  // Only show loading if auth is still loading
  if (!isLoaded || checkingUser) {
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

  // Check if user is an agent without NPN
  const isAgentWithoutNpn = isSignedIn && userRole === "agent" && !userNpn;
  const isAgent = userRole === "agent";

  console.log("[App] Agent check:", {
    isSignedIn,
    userRole,
    userNpn,
    isAgentWithoutNpn,
    isAgent,
  });

  // If user is signed in as an agent without NPN, show NPN required page for ALL routes
  if (isAgentWithoutNpn) {
    return <NpnRequired />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Handle agent redirects */}
          {isAgent ? (
            <>
              <Route path="/" element={<Navigate to="/inquiries" replace />} />
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
              <Route path="*" element={<Navigate to="/inquiries" replace />} />
            </>
          ) : (
            <>
              {/* Regular user routes */}
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
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
