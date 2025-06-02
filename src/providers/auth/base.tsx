import { ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  npn?: string;
  unsafeMetadata?: Record<string, any>;
}

export interface Organization {
  id: string;
  name: string;
  displayName?: string;
  slug?: string;
}

export interface AuthHooks {
  useAuth: () => {
    isLoaded: boolean;
    isSignedIn: boolean;
    userId?: string;
  };
  useUser: () => User | null;
  useOrganization: () => Organization | null;
  useLogout: () => () => Promise<void>;
  useUserSettingsUrl?: () => string;
  useOrganizationSettingsUrl?: () => string;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export abstract class BaseAuthProvider {
  abstract getProvider(): React.ComponentType<AuthProviderProps>;
  abstract getHooks(): AuthHooks;
  abstract getProviderName(): string;
  abstract getAccessToken(): Promise<string | null>;
}
