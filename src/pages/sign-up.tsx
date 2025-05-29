import { SignUp } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { MeshGradientBackground } from "../components/MeshGradientBackground";

export default function SignUpPage() {
  const location = useLocation();

  console.log("[SignUp] Render", {
    path: location.pathname,
    timestamp: new Date().toISOString(),
    search: location.search,
    hash: location.hash,
  });

  useEffect(() => {
    console.log("[SignUp] Mount/Update", {
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });

    return () => {
      console.log("[SignUp] Unmount", {
        path: location.pathname,
        timestamp: new Date().toISOString(),
      });
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <MeshGradientBackground />
      <div className="w-full max-w-[480px]">
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "glass-panel shadow-xl !bg-white/40 !backdrop-blur-md",
              headerTitle: "!text-gray-900",
              headerSubtitle: "!text-gray-700",
              formButtonPrimary: "!bg-primary hover:!bg-primary/90",
              formFieldInput: "!bg-white/50 !border-white/30",
              footerActionLink: "!text-primary hover:!text-primary/80",
              identityPreviewText: "!text-gray-700",
              identityPreviewEditButton: "!text-primary hover:!text-primary/80",
              formFieldLabel: "!text-gray-700",
              dividerLine: "!bg-gray-200/50",
              dividerText: "!text-gray-600",
              socialButtonsBlockButton: "!hidden",
              socialButtonsProviderIcon: "!hidden",
              socialButtonsBlockButtonText: "!hidden",
              formHeaderTitle: "!text-gray-900",
              formHeaderSubtitle: "!text-gray-700",
              otpCodeFieldInput: "!bg-white/50 !border-white/30",
              formFieldInputShowPasswordButton: "!text-gray-600",
              backLink: "!text-primary hover:!text-primary/80",
              alternativeMethodsBlockButton:
                "!text-primary hover:!text-primary/80",
              dividerRow: "!hidden",
            },
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
              showOptionalFields: false,
            },
            variables: {
              colorPrimary: "rgb(134 239 172)", // Matches your primary color
              colorText: "rgb(17 24 39)",
              colorTextSecondary: "rgb(55 65 81)",
              colorBackground: "transparent",
              colorInputBackground: "rgba(255, 255, 255, 0.5)",
              colorInputText: "rgb(17 24 39)",
              borderRadius: "1rem",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
