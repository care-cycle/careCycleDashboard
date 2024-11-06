// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const DEV_DOMAIN = 'http://10.0.0.155:5173';
const PROD_DOMAIN = 'app.nodable.ai';

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      isSatellite={import.meta.env.VITE_NODE_ENV !== 'development'}
      domain={PROD_DOMAIN}
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