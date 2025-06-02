import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Building,
  Users,
  Mail,
  UserPlus,
  X,
  Info,
} from "lucide-react";
import { useTesseral } from "@/providers/auth/tesseral";
import { useOrganization } from "@/providers/auth";
import { toast } from "sonner";

// Define proper types for the API responses
interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  status?: string;
}

interface Invite {
  id: string;
  email?: string;
  inviteEmail?: string;
  role?: string;
  inviteRole?: string;
  status?: string;
}

interface CreateInvitePayload {
  body: {
    email: string;
    role: "admin" | "member";
  };
}

export function TesseralOrganizationSettings() {
  const { frontendApiClient } = useTesseral();
  const organization = useOrganization();
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  // Invite form state
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);

  // Load organization users
  useEffect(() => {
    // Skip if no organization or already loaded
    if (!organization || !frontendApiClient || dataLoaded) {
      return;
    }

    const loadData = async () => {
      setLoading(true);

      try {
        // Load users
        const usersResponse = await frontendApiClient.users.listUsers();
        if (Array.isArray(usersResponse)) {
          setUsers(usersResponse);
        } else {
          console.log("Unexpected user list response:", usersResponse);
          setUsers([]);
        }
      } catch (error) {
        console.error("Failed to load users:", error);
        setUsers([]);
      }

      try {
        // Load invites
        const invitesResponse =
          await frontendApiClient.userInvites.listUserInvites();
        if (Array.isArray(invitesResponse)) {
          setInvites(invitesResponse);
        } else {
          console.log("Unexpected invites response:", invitesResponse);
          setInvites([]);
        }
      } catch (error) {
        console.error("Failed to load invites:", error);
        setInvites([]);
      }

      setLoading(false);
      setDataLoaded(true);
    };

    loadData();
  }, [organization, frontendApiClient, dataLoaded]); // Added frontendApiClient dependency

  // Refresh function to reload data
  const refreshData = async () => {
    if (!frontendApiClient) return;

    try {
      const [usersResponse, invitesResponse] = await Promise.all([
        frontendApiClient.users.listUsers(),
        frontendApiClient.userInvites.listUserInvites(),
      ]);

      if (Array.isArray(usersResponse)) {
        setUsers(usersResponse);
      }
      if (Array.isArray(invitesResponse)) {
        setInvites(invitesResponse);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  const handleInviteUsers = async () => {
    if (!inviteEmails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    // Parse comma-separated emails and clean them
    const emailList = inviteEmails
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email(s): ${invalidEmails.join(", ")}`);
      return;
    }

    setInviting(true);
    const successfulInvites: string[] = [];
    const failedInvites: { email: string; error: string }[] = [];

    // Send invites one by one
    for (const email of emailList) {
      try {
        const payload: CreateInvitePayload = {
          body: {
            email: email,
            role: inviteRole,
          },
        };
        await frontendApiClient.userInvites.createUserInvite(payload);
        successfulInvites.push(email);
      } catch (error: any) {
        failedInvites.push({
          email,
          error: error.message || "Failed to send",
        });
      }
    }

    // Show results
    if (successfulInvites.length > 0) {
      toast.success(`Successfully invited: ${successfulInvites.join(", ")}`);
    }
    if (failedInvites.length > 0) {
      toast.error(
        `Failed to invite: ${failedInvites.map((f) => f.email).join(", ")}`,
      );
    }

    // Clear form if at least one invite was successful
    if (successfulInvites.length > 0) {
      setInviteEmails("");
      setInviteRole("member");

      // Reload invites
      await refreshData();
    }

    setInviting(false);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await frontendApiClient.userInvites.deleteUserInvite(inviteId);
      toast.success("Invitation revoked");

      // Reload invites
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke invitation");
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading || !dataLoaded ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading organization data...
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground">Name:</Label>
                <span className="font-medium">
                  {organization?.displayName || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground">ID:</Label>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                  {organization?.id || "N/A"}
                </code>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
          <CardDescription>Manage users in your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading || !dataLoaded ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading team members...
              </span>
            </div>
          ) : (
            <>
              {/* Invite Form */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span className="font-medium">Invite Team Members</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="invite-emails">Email Addresses</Label>
                    <Input
                      id="invite-emails"
                      type="text"
                      placeholder="email1@example.com, email2@example.com, ..."
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Separate multiple emails with commas
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(e.target.value as "admin" | "member")
                      }
                      className="px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      onClick={handleInviteUsers}
                      disabled={inviting || !inviteEmails.trim()}
                      className="flex-1"
                    >
                      {inviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Invites...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invites
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Pending Invites */}
              {invites.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    Pending Invitations
                    <Badge variant="secondary" className="h-5">
                      {invites.length}
                    </Badge>
                  </h4>
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {invite.email || invite.inviteEmail}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {invite.role || invite.inviteRole || "member"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Members */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  Current Members
                  <Badge variant="secondary" className="h-5">
                    {users.length}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Member</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {users.length === 0 && invites.length === 0 && (
                <Alert>
                  <AlertDescription>
                    No team members found. Start by inviting users to your
                    organization.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
