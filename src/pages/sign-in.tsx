import { Navigate } from 'react-router-dom';
import { SignIn } from "@clerk/clerk-react";
import { isAuthEnabled } from '@/lib/utils';

const BASE_URL = import.meta.env.VITE_NODE_ENV === 'development' ? 'http://10.0.0.155:5173' : 'https://clerk.nodable.ai';

export default function SignInPage() {
  // Redirect to dashboard if auth is disabled
  if (!isAuthEnabled()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="w-full max-w-[480px] p-6">
        <div className="mb-8 text-center">
          <img 
            src="https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/66bfa1f56b8fef22f0e4dfe5_Nodable%20Logo%20Black%20Text%2072%20ppi.png"
            alt="Nodable Labs"
            className="h-8 mx-auto mb-6"
          />
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "glass-panel shadow-xl",
            }
          }}
          path="/sign-in"
          routing="path"
          signUpUrl={import.meta.env.VITE_NODE_ENV === 'development' ? `${BASE_URL}/sign-up` : '/sign-up'}
          fallbackRedirectUrl={import.meta.env.VITE_NODE_ENV === 'development' ? `${BASE_URL}/dashboard` : '/dashboard'}
        />
      </div>
    </div>
  );
} 