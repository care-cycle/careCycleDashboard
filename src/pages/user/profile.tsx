import {
  UserProfile,
  OrganizationProfile,
  useOrganization,
  CreateOrganization,
} from "@clerk/clerk-react";
import { RootLayout } from "@/components/layout/root-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegularHoursConfig } from "@/components/operating-hours/regular-hours";
import { SpecialHoursConfig } from "@/components/operating-hours/special-hours";
import { HolidayConfig } from "@/components/operating-hours/holiday-config";
import { useUserRole } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

export default function ProfilePage() {
  const { organization } = useOrganization();
  const { isAdmin } = useUserRole();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await apiClient.get("/portal/me");
        setUserRole(response.data.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  const isAgent = userRole === "agent";

  return (
    <RootLayout hideKnowledgeSearch>
      <div className="space-y-6 relative z-20">
        <h1 className="text-3xl font-bold tracking-tight">
          {isAgent ? "Account Settings" : "Settings"}
        </h1>

        {/* Agent view - simplified without tabs */}
        {isAgent ? (
          <div className="space-y-6 relative z-30">
            <UserProfile
              appearance={{
                elements: {
                  rootBox: "w-full max-w-4xl",
                  card: "glass-panel shadow-lg",
                },
              }}
            />
          </div>
        ) : /* Regular user/admin view with tabs */
        isAdmin ? (
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="relative bg-white/50 backdrop-blur-sm z-50">
              <TabsTrigger
                className="relative data-[state=active]:bg-white/80 hover:bg-white/60"
                value="profile"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                className="relative data-[state=active]:bg-white/80 hover:bg-white/60"
                value="organization"
              >
                Organization
              </TabsTrigger>
              <TabsTrigger
                className="relative data-[state=active]:bg-white/80 hover:bg-white/60"
                value="operating-hours"
              >
                Operating Hours
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-6 relative z-30">
              <UserProfile />
            </TabsContent>
            <TabsContent
              value="organization"
              className="space-y-6 relative z-30"
            >
              {organization ? <OrganizationProfile /> : <CreateOrganization />}
            </TabsContent>
            <TabsContent
              value="operating-hours"
              className="space-y-6 relative z-30"
            >
              <Tabs defaultValue="regular">
                <TabsList className="relative bg-white/50 backdrop-blur-sm z-50">
                  <TabsTrigger
                    className="relative data-[state=active]:bg-white/80 hover:bg-white/60"
                    value="regular"
                  >
                    Regular Hours
                  </TabsTrigger>
                  <TabsTrigger
                    className="relative data-[state=active]:bg-white/80 hover:bg-white/60"
                    value="special"
                  >
                    Special Hours
                  </TabsTrigger>
                  <TabsTrigger
                    className="relative data-[state=active]:bg-white/80 hover:bg-white/60"
                    value="holidays"
                  >
                    Holidays
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="regular" className="relative z-30">
                  <RegularHoursConfig />
                </TabsContent>

                <TabsContent value="special" className="relative z-30">
                  <SpecialHoursConfig />
                </TabsContent>

                <TabsContent value="holidays" className="relative z-30">
                  <HolidayConfig />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6 relative z-30">
            <UserProfile />
          </div>
        )}
      </div>
    </RootLayout>
  );
}
