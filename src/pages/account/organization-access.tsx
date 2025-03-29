import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { RemovedUserState } from "@/components/auth/removed-user-state";
import { useAuth } from "@/hooks/use-auth";

interface RemovedUserDetails {
  organizationName?: string;
  adminName?: string;
  contactEmail?: string;
}

export default function OrganizationAccessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [details, setDetails] = useState<RemovedUserDetails>({});

  useEffect(() => {
    // If we have query params from the redirect, use them
    if (router.query.organizationName) {
      setDetails({
        organizationName: router.query.organizationName as string,
        adminName: router.query.adminName as string,
        contactEmail: router.query.contactEmail as string,
      });
    }
  }, [router.query]);

  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  return <RemovedUserState {...details} />;
}
