import { SignIn } from "@clerk/clerk-react";
import { MeshGradientBackground } from "../components/MeshGradientBackground";

const BASE_URL =
  import.meta.env.VITE_NODE_ENV === "development"
    ? "http://localhost:5173"
    : "https://app.carecycle.ai";

export default function SignInPage() {
  // For agents, we'll redirect to inquiries page instead of dashboard
  // This will be handled by the App.tsx routing logic
  const redirectUrl =
    import.meta.env.VITE_NODE_ENV === "development" ? `${BASE_URL}/` : "/";

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
          fallbackRedirectUrl={redirectUrl}
        />
      </div>
    </div>
  );
}
