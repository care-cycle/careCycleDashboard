import { useLocation } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";

const PROD_DOMAIN = "https://app.carecycle.ai";
const DEV_DOMAIN = "http://localhost:5173";

export default function SignUpWrapper() {
  const location = useLocation();
  const isVerificationStep = location.pathname.includes("verify-email-address");
  const baseUrl =
    import.meta.env.VITE_NODE_ENV === "development" ? DEV_DOMAIN : PROD_DOMAIN;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="w-full max-w-[480px] p-6">
        <div className="mb-8 text-center">
          <img
            src="https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/67e0b1dc686c0fa648631187_Color%201%20(on%20white).png"
            alt="careCycle"
            className="h-8 mx-auto mb-6"
          />
          <h1 className="text-2xl font-semibold text-gray-900">
            {isVerificationStep ? "Verify your email" : "Create an account"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isVerificationStep
              ? "Check your email for a verification link"
              : "Get started with careCycle"}
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "glass-panel shadow-xl",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl={`${baseUrl}/sign-in`}
          fallbackRedirectUrl={`${baseUrl}/dashboard`}
        />
      </div>
    </div>
  );
}
