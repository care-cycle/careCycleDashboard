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
              card: "glass-panel shadow-xl",
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
