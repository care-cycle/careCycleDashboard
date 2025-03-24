import { SignIn } from "@clerk/clerk-react";
import { MeshGradientBackground } from "../components/MeshGradientBackground";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? "http://localhost:5173"
    : "https://clerk.carecycle.ai";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <MeshGradientBackground />
      <div className="w-full max-w-[480px]">
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "glass-panel shadow-xl",
            },
          }}
          path="/sign-in"
          routing="path"
          signUpUrl={
            import.meta.env.VITE_NODE_ENV === "development"
              ? `${BASE_URL}/sign-up`
              : "/sign-up"
          }
          fallbackRedirectUrl={
            import.meta.env.VITE_NODE_ENV === "development"
              ? `${BASE_URL}/dashboard`
              : "/dashboard"
          }
        />
      </div>
    </div>
  );
}
