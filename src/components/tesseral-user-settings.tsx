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
import { Loader2, User, Mail, Key, Shield, Save } from "lucide-react";
import { useTesseral } from "@/providers/auth/tesseral";
import { useUser } from "@/providers/auth";
import { toast } from "sonner";
// Temporarily commented out until 2FA is implemented
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Alert, AlertDescription } from "@/components/ui/alert";

export function TesseralUserSettings() {
  const { frontendApiClient } = useTesseral();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [hasNameChanged, setHasNameChanged] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 2FA state - commented out until implementation
  // const [show2FAModal, setShow2FAModal] = useState(false);
  // const [twoFAStep, setTwoFAStep] = useState<'setup' | 'verify'>('setup');
  // const [twoFASecret, setTwoFASecret] = useState('');
  // const [twoFAQRCode, setTwoFAQRCode] = useState('');
  // const [verificationCode, setVerificationCode] = useState('');
  // const [enabling2FA, setEnabling2FA] = useState(false);
  // const [has2FAEnabled, setHas2FAEnabled] = useState(false);
  // const [copiedSecret, setCopiedSecret] = useState(false);

  // Update name when user data loads
  useEffect(() => {
    if (user?.name && !hasNameChanged) {
      setName(user.name);
    }
  }, [user?.name, hasNameChanged]);

  // Check if 2FA is already enabled - commented out until implementation
  // useEffect(() => {
  //   const check2FAStatus = async () => {
  //     try {
  //       // TODO: Call API to check if 2FA is enabled
  //       // const response = await frontendApiClient.me.get2FAStatus();
  //       // setHas2FAEnabled(response.enabled);

  //       // Debug: Log available methods on frontendApiClient to discover 2FA APIs
  //       if (frontendApiClient && import.meta.env.DEV) {
  //         console.log('🔍 Tesseral frontendApiClient:', frontendApiClient);
  //         console.log('🔍 Available methods on frontendApiClient.me:', Object.keys(frontendApiClient.me || {}));

  //         // Try to discover 2FA related methods
  //         const clientKeys = Object.keys(frontendApiClient) as Array<keyof typeof frontendApiClient>;
  //         clientKeys.forEach(key => {
  //           const value = frontendApiClient[key];
  //           if (value && typeof value === 'object') {
  //             console.log(`🔍 frontendApiClient.${key}:`, Object.keys(value));
  //           }
  //         });
  //       }
  //     } catch (error) {
  //       console.error('Failed to check 2FA status:', error);
  //     }
  //   };

  //   if (frontendApiClient && user) {
  //     check2FAStatus();
  //   }
  // }, [frontendApiClient, user]);

  const handleNameChange = (value: string) => {
    setName(value);
    setHasNameChanged(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // TODO: Call the appropriate API to update the user's name
      // await frontendApiClient.me.updateProfile({ name });

      // Don't show success toast until the API is actually implemented
      toast.error("Profile updates are not yet supported");
      // TODO: Once API is implemented, change to: toast.success("Profile updated successfully");
      // setHasNameChanged(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      // Note: This API currently doesn't validate the current password
      // This is a security concern that should be addressed
      await frontendApiClient.me.setPassword({
        password: newPassword,
      });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  // 2FA functions - commented out until implementation
  // const handle2FASetup = async () => { ... };
  // const handleVerify2FA = async () => { ... };
  // const handleDisable2FA = async () => { ... };
  // const copySecret = () => { ... };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your basic profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Email addresses cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={!hasNameChanged || savingProfile}
              className="w-full"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Change Password</h4>

              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={
                  loading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </div>

            {/* 2FA Section - Hidden for now until Tesseral provides API support */}
            {/* <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">
                      {has2FAEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
                    </p>
                  </div>
                </div>
                {has2FAEnabled ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDisable2FA}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Disable
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handle2FASetup}
                    disabled={loading}
                  >
                    Setup
                  </Button>
                )}
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>

      {/* 2FA Setup Modal - Hidden for now */}
      {/* <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              {twoFAStep === 'setup' 
                ? 'Scan the QR code below with your authenticator app, or enter the secret manually.'
                : 'Enter the 6-digit code from your authenticator app to verify setup.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {twoFAStep === 'setup' ? (
              <>
                {/* QR Code Section */}
      {/* <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-gray-400" />
                    <span className="sr-only">QR Code for 2FA setup</span>
                  </div>
                </div>

                {/* Manual Entry Section */}
      {/* <div className="space-y-2">
                  <Label className="text-sm font-medium">Can't scan? Enter this code manually:</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                      {twoFASecret || 'Loading...'}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copySecret}
                      disabled={!twoFASecret}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Save this secret code in a safe place. You'll need it to recover access if you lose your authenticator device.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <>
                {/* Verification Step */}
      {/* <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-2xl font-mono tracking-widest"
                      maxLength={6}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FAModal(false)}>
              Cancel
            </Button>
            {twoFAStep === 'setup' ? (
              <Button 
                onClick={() => setTwoFAStep('verify')}
                disabled={enabling2FA || !twoFASecret}
              >
                I've Added the Code
              </Button>
            ) : (
              <Button 
                onClick={handleVerify2FA}
                disabled={enabling2FA || verificationCode.length !== 6}
              >
                {enabling2FA ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable 2FA'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </>
  );
}
