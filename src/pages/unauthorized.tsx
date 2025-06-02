import { useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, LogOut } from "lucide-react";
import { useEffect } from "react";
import { intervalManager } from "@/utils/interval-manager";
import { useLogout, getAuthProviderName } from "@/providers/auth";
import { MeshGradientBackground } from "@/components/MeshGradientBackground";

const DEFAULT_SUPPORT_EMAIL = "support@carecycle.ai";

export function UnauthorizedPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const logout = useLogout();
  const authProvider = getAuthProviderName();

  // Try to get error details from route state first, then fallback to query params
  const errorState = location.state || {};
  const reason =
    errorState.reason ||
    searchParams.get("reason") ||
    "Your access has been restricted";
  const message =
    errorState.message ||
    searchParams.get("message") ||
    "Please contact your administrator for assistance.";
  const contact =
    errorState.contact || searchParams.get("contact") || DEFAULT_SUPPORT_EMAIL;

  // Ensure no background tasks are running when this page mounts
  useEffect(() => {
    intervalManager.clear();

    // Prevent navigation back to protected pages
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);

    // Hide feedback module
    const style = document.createElement("style");
    style.textContent = `
      #feedback-module {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.head.removeChild(style);
    };
  }, []);

  const handleLogout = async () => {
    // Clear any intervals first
    intervalManager.clear();

    try {
      // Sign out
      await logout();

      // For Tesseral, we can't redirect to sign-in, so reload the page
      // For Clerk, redirect to sign-in
      if (authProvider === "tesseral") {
        window.location.reload();
      } else {
        window.location.replace("/sign-in");
      }
    } catch (error) {
      console.error("[UnauthorizedPage] Sign out error:", error);
      // Fallback navigation
      if (authProvider === "tesseral") {
        window.location.reload();
      } else {
        window.location.replace("/sign-in");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <MeshGradientBackground />
      <div className="w-full max-w-[480px]">
        <Card className="glass-panel shadow-xl">
          <CardHeader className="space-y-3">
            <div className="flex justify-center mb-6">
              <img
                src="/carecyclelogofull.svg"
                alt="careCycle"
                className="h-10"
              />
            </div>
            <CardTitle className="text-2xl text-center">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-center text-base">
              {reason}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">{message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={`mailto:${contact}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
