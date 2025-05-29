import { useLocation, useSearchParams } from "react-router-dom";
import { SignUp, useSignUp, useClerk } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PROD_DOMAIN = "https://app.carecycle.ai";
const DEV_DOMAIN = "http://localhost:5173";

export default function SignUpWrapper() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signUp, isLoaded, setActive } = useSignUp();
  const clerk = useClerk();
  const [showCustomSignup, setShowCustomSignup] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    npn: "",
  });

  const isVerificationStep = location.pathname.includes("verify-email-address");
  const baseUrl =
    import.meta.env.VITE_NODE_ENV === "development" ? DEV_DOMAIN : PROD_DOMAIN;

  useEffect(() => {
    // Check if this is an agent invitation
    const checkInvitation = async () => {
      if (!isLoaded) return;

      // Check URL params for role
      const roleParam = searchParams.get("role");
      const ticket = searchParams.get("__clerk_ticket");
      const invitationToken = searchParams.get("__clerk_invitation_token");

      // If role=agent is in URL or we have an invitation token, check if it's an agent
      if (roleParam === "agent" || ticket || invitationToken) {
        setIsAgent(roleParam === "agent");
        setShowCustomSignup(roleParam === "agent");
      }
    };

    checkInvitation();
  }, [isLoaded, searchParams]);

  const handleCustomSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    setLoading(true);
    try {
      const ticket = searchParams.get("__clerk_ticket");

      if (ticket) {
        // If we have a ticket, use the ticket strategy
        const result = await signUp.create({
          strategy: "ticket",
          ticket: ticket,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          unsafeMetadata: {
            ...(isAgent && { npn: formData.npn, role: "agent" }),
          },
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });

          // For agents, immediately save NPN to backend
          if (isAgent && formData.npn) {
            try {
              // Small delay to ensure session is active
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Import apiClient dynamically to avoid circular dependencies
              const { default: apiClient } = await import("@/lib/api-client");
              await apiClient.patch("/portal/me/update-npn", {
                npn: formData.npn,
              });
              console.log("NPN saved successfully after signup");
            } catch (error) {
              console.error("Failed to save NPN after signup:", error);
              // Don't block the redirect even if NPN save fails
              // The NpnRequired screen will catch it
            }
          }

          window.location.href = "/";
        } else {
          // Handle other statuses
          console.error("Signup not complete:", result);
          toast.error("Please complete the signup process");
        }
      } else {
        // Regular signup without invitation
        const result = await signUp.create({
          emailAddress: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          unsafeMetadata: {
            ...(isAgent && { npn: formData.npn, role: "agent" }),
          },
        });

        // Send email verification
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        // Redirect to verification page
        window.location.href = `${baseUrl}/sign-up/verify-email-address`;
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.errors?.[0]?.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  // If it's an agent signup, show custom form
  if (showCustomSignup && isAgent) {
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
              Create your agent account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Please provide your information including your NPN
            </p>
          </div>

          <form onSubmit={handleCustomSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            {!searchParams.get("__clerk_ticket") && (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="npn">
                NPN (National Producer Number){" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="npn"
                type="text"
                required
                placeholder="Enter your NPN"
                value={formData.npn}
                onChange={(e) =>
                  setFormData({ ...formData, npn: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Your NPN is required for agent accounts
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <a
                href={`${baseUrl}/sign-in`}
                className="text-blue-600 hover:underline"
              >
                Sign in
              </a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Default Clerk SignUp component for non-agent users
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
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
