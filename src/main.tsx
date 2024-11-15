// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';
import { isAuthEnabled } from '@/lib/utils';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Wrap the app conditionally based on auth status
export const AppWrapper = () => {
  if (!isAuthEnabled()) {
    return (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  }

  if (!PUBLISHABLE_KEY) {
    throw new Error('Missing Clerk Publishable Key');
  }

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
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
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);