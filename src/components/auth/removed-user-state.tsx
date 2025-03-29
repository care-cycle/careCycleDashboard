import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";

interface RemovedUserStateProps {
  organizationName?: string;
  adminName?: string;
  contactEmail?: string;
}

export function RemovedUserState({
  organizationName = "the organization",
  adminName = "an administrator",
  contactEmail = "support@example.com",
}: RemovedUserStateProps) {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-destructive">
            Organization Access Removed
          </CardTitle>
          <CardDescription className="text-center">
            Your access to {organizationName} has been removed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">
              This action was taken by {adminName}. If you believe this was a
              mistake or need assistance, please contact your administrator.
            </p>
            <p>You can still access your personal account and data.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Return to Dashboard</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href={`mailto:${contactEmail}`}>
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </a>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="text-primary hover:underline"
            >
              Contact support
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
