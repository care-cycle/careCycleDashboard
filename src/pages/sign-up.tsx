import { SignUp } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function SignUpPage() {
  const location = useLocation();

  console.log('[SignUp] Render', {
    path: location.pathname,
    timestamp: new Date().toISOString(),
    search: location.search,
    hash: location.hash,
  });

  useEffect(() => {
    console.log('[SignUp] Mount/Update', {
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });
    
    return () => {
      console.log('[SignUp] Unmount', {
        path: location.pathname,
        timestamp: new Date().toISOString(),
      });
    };
  }, [location.pathname]);

  return (
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
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}