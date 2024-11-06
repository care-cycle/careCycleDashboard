// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const DEV_DOMAIN = 'http://10.0.0.155:5173';
const PROD_DOMAIN = 'https://app.nodable.ai';

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      isSatellite={import.meta.env.VITE_NODE_ENV !== 'development'}
      domain="clerk.nodable.ai"
      proxyUrl={undefined}
      signInUrl={`${PROD_DOMAIN}/sign-in`}
      signUpUrl={`${PROD_DOMAIN}/sign-up`}
      afterSignOutUrl={`${PROD_DOMAIN}/sign-in`}
      fallbackRedirectUrl={`${PROD_DOMAIN}/dashboard`}
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