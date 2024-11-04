// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, SignUp } from '@clerk/clerk-react';
import { UIProvider } from './contexts/ui-context';
import { AnimatePresence } from 'framer-motion';
import { PublicRoute } from './components/auth/public-route';
import { PrivateRoute } from './components/auth/private-route';
import { VerifyEmail } from "./pages/sign-up/verify-email";
import Dashboard from './pages/dashboard';
import Calls from './pages/calls';
import SignIn from './pages/sign-in';
import ProfilePage from './pages/user/profile';
import BillingPage from './pages/user/billing';

export default function App() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-6 rounded-lg">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <UIProvider>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/sign-in" 
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            } 
          />
          
          {/* Sign-up routes */}
          <Route 
            path="/sign-up/*" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
                <div className="w-full max-w-[480px] p-6">
                  <div className="mb-8 text-center">
                    <img 
                      src="https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/66bfa1f56b8fef22f0e4dfe5_Nodable%20Logo%20Black%20Text%2072%20ppi.png"
                      alt="Nodable Labs"
                      className="h-8 mx-auto mb-6"
                    />
                    <h1 className="text-2xl font-semibold text-gray-900">Create an account</h1>
                    <p className="text-sm text-gray-500 mt-1">Get started with Nodable Labs</p>
                  </div>
                  <SignUp 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "glass-panel shadow-xl",
                      }
                    }}
                    routing="hash"
                  />
                </div>
              </div>
            } 
          />
          <Route 
            path="/sign-up/verify-email-address" 
            element={<VerifyEmail />} 
          />
          
          {/* Private Routes */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
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
                <BillingPage />
              </PrivateRoute>
            } 
          />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </UIProvider>
  );
}