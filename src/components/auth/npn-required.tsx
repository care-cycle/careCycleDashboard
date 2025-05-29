import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { useNavigate } from "react-router-dom";
import { MeshGradientBackground } from "../MeshGradientBackground";

export function NpnRequired() {
  const [npn, setNpn] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!npn.trim()) {
      toast.error("Please enter your NPN");
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch("/portal/me/update-npn", { npn });
      toast.success("NPN saved successfully!");

      // Redirect to inquiries for agents
      navigate("/inquiries");
      // Force a page reload to re-check the user
      window.location.reload();
    } catch (error) {
      console.error("Error updating NPN:", error);
      toast.error("Failed to save NPN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <MeshGradientBackground />
      <Card className="w-full max-w-md glass-panel shadow-xl relative z-10">
        <CardHeader>
          <CardTitle>Agent Information Required</CardTitle>
          <CardDescription>
            As an agent, you need to provide your National Producer Number (NPN)
            to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={npn}
                onChange={(e) => setNpn(e.target.value)}
                className="mt-1 !bg-white/50 !border-white/30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your NPN is required for compliance and verification purposes.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
