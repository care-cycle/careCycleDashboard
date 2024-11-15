import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import { isAuthEnabled } from '@/lib/utils';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AppWrapper() {
  const authEnabled = isAuthEnabled();

  if (!authEnabled) {
    return (
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>
    );
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error('Missing Clerk Publishable Key');
  }

  return (
    <StrictMode>
      <ClerkProvider 
        publishableKey={CLERK_PUBLISHABLE_KEY}
        isSatellite={false}
        domain="clerk.nodable.ai"
        proxyUrl={undefined}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        afterSignOutUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl={true}
        cookieOptions={{
          secure: import.meta.env.VITE_NODE_ENV !== 'development',
          sameSite: 'lax'
        }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </StrictMode>
  );
} 