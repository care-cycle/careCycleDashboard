import { UserProfile, OrganizationProfile, useOrganization, CreateOrganization } from "@clerk/clerk-react"
import { RootLayout } from "@/components/layout/root-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  const { organization, isLoaded } = useOrganization()
  const topMetrics = [
    { title: "Account Status", value: "Active" },
  ]

  return (
    <RootLayout topMetrics={topMetrics} hideKnowledgeSearch>
      <div className="container max-w-screen-2xl mx-auto px-4">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">User Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <UserProfile 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "glass-panel shadow-xl",
                }
              }}
            />
          </TabsContent>

          <TabsContent value="organization">
            {!isLoaded ? (
              <div>Loading...</div>
            ) : organization ? (
              <OrganizationProfile
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "glass-panel shadow-xl",
                    organizationSwitcherTrigger: "hidden",
                    organizationPreview: "hidden",
                  }
                }}
                routing="virtual"
              />
            ) : (
              <CreateOrganization 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "glass-panel shadow-xl",
                  }
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RootLayout>
  )
} 