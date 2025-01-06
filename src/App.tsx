// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { UIProvider } from './contexts/ui-context';
import { AnimatePresence } from 'framer-motion';
import { PublicRoute } from './components/auth/public-route';
import { PrivateRoute } from './components/auth/private-route';
import { VerifyEmail } from "./pages/sign-up/verify-email";
import SignUpPage from './pages/sign-up';
import Dashboard from './pages/dashboard';
import Calls from './pages/calls';
import SignIn from './pages/sign-in';
import ProfilePage from './pages/user/profile';
import BillingPage from './pages/user/billing';
import { isAuthEnabled } from '@/lib/utils';
import { useInitialData } from './hooks/use-client-data';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient()

// Non-auth version of App
function NonAuthApp() {
  return (
    <UIProvider>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/user/profile" element={<ProfilePage />} />
          <Route path="/user/billing" element={<BillingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </UIProvider>
  );
}

// Auth version of App
function AuthApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const { clientInfo, isLoading: isLoadingInitialData } = useInitialData();

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
          <Route path="/calls" element={<PrivateRoute><Calls /></PrivateRoute>} />
          <Route path="/user/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/user/billing" element={<PrivateRoute><BillingPage /></PrivateRoute>} />
          
          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </UIProvider>
  );
}

// Main App component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthApp />
    </QueryClientProvider>
  );
}