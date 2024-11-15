import { UserProfile, OrganizationProfile, useOrganization, CreateOrganization } from "@clerk/clerk-react"
import { RootLayout } from "@/components/layout/root-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isAuthEnabled } from '@/lib/utils'

// Placeholder component for when auth is disabled
const DemoProfile = () => {
  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Demo User Profile</h3>
        <p className="text-sm text-gray-500">This is a demo profile page. Authentication is disabled.</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <div className="text-sm text-gray-600">demo@example.com</div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <div className="text-sm text-gray-600">Demo User</div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Organization</label>
          <div className="text-sm text-gray-600">Demo Organization</div>
        </div>
      </div>
    </div>
  )
}

// Auth version of the profile page
function AuthProfilePage() {
  const { organization } = useOrganization();
  
  return (
    <RootLayout hideKnowledgeSearch>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-6">
            <UserProfile />
          </TabsContent>
          <TabsContent value="organization" className="space-y-6">
            {organization ? <OrganizationProfile /> : <CreateOrganization />}
          </TabsContent>
        </Tabs>
      </div>
    </RootLayout>
  );
}

// Non-auth version of the profile page
function NonAuthProfilePage() {
  return (
    <RootLayout hideKnowledgeSearch>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-6">
            <DemoProfile />
          </TabsContent>
          <TabsContent value="organization" className="space-y-6">
            <DemoProfile />
          </TabsContent>
        </Tabs>
      </div>
    </RootLayout>
  );
}

export default function ProfilePage() {
  return isAuthEnabled() ? <AuthProfilePage /> : <NonAuthProfilePage />;
} 