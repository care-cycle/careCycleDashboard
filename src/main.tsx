// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const DEV_DOMAIN = 'http://localhost:5173'; // Changed to localhost for consistency
const PROD_DOMAIN = 'https://clerk.nodable.ai';
const BASE_URL = import.meta.env.VITE_NODE_ENV === 'development' ? DEV_DOMAIN : PROD_DOMAIN;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      isSatellite={import.meta.env.VITE_NODE_ENV !== 'development'} // Enable satellite only in production
      domain={import.meta.env.VITE_NODE_ENV === 'development' ? DEV_DOMAIN : PROD_DOMAIN}
      proxyUrl={import.meta.env.VITE_NODE_ENV === 'development' ? undefined : PROD_DOMAIN} // Remove proxyUrl in development
      signInUrl={import.meta.env.VITE_NODE_ENV === 'development' ? `${BASE_URL}/sign-in` : `${BASE_URL}/sign-in`}
      signUpUrl={import.meta.env.VITE_NODE_ENV === 'development' ? `${BASE_URL}/sign-up` : `${BASE_URL}/sign-up`}
      fallbackRedirectUrl={import.meta.env.VITE_NODE_ENV === 'development' ? `${BASE_URL}/dashboard` : `${BASE_URL}/dashboard`}
      forceRedirectUrl={true}
      cookieOptions={{
        secure: import.meta.env.VITE_NODE_ENV !== 'development', // Secure cookies in production
        sameSite: 'lax'
      }}
      appearance={{
        layout: {
          helpPageUrl: "https://clerk.com/support",
          logoImageUrl: "https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/66bfa1f56b8fef22f0e4dfe5_Nodable%20Logo%20Black%20Text%2072%20ppi.png",
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "blockButton",
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);