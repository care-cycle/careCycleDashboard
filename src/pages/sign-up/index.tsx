import { useLocation } from 'react-router-dom';
import { SignUp } from "@clerk/clerk-react";

export default function SignUpWrapper() {
  const location = useLocation();
  const isVerificationStep = location.pathname.includes('verify-email-address');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="w-full max-w-[480px] p-6">
        <div className="mb-8 text-center">
          <img 
            src="https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/66bfa1f56b8fef22f0e4dfe5_Nodable%20Logo%20Black%20Text%2072%20ppi.png"
            alt="Nodable Labs"
            className="h-8 mx-auto mb-6"
          />
          <h1 className="text-2xl font-semibold text-gray-900">
            {isVerificationStep ? "Verify your email" : "Create an account"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isVerificationStep ? "Check your email for a verification link" : "Get started with Nodable Labs"}
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "glass-panel shadow-xl",
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl={import.meta.env.DEV ? "https://clerk.nodable.ai/sign-in" : "/sign-in"}
          fallbackRedirectUrl={import.meta.env.DEV ? "http://10.0.0.155:5173/dashboard" : "/dashboard"}
        />
      </div>
    </div>
  );
} 