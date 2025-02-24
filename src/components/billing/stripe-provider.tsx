import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  stripeAccount: import.meta.env.VITE_STRIPE_ACCOUNT_ID,
  apiVersion: "2023-10-16",
  locale: "en",
});

export function StripeProvider({
  children,
  clientSecret,
}: {
  children: React.ReactNode;
  clientSecret?: string;
}) {
  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "flat" as const,
        },
      }
    : undefined;

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
