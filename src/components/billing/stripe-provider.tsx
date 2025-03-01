import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect } from "react";

// Log Stripe configuration
console.log("Stripe configuration:", {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    ? "Present"
    : "Missing",
  accountId: import.meta.env.VITE_STRIPE_ACCOUNT_ID ? "Present" : "Missing",
});

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  stripeAccount: import.meta.env.VITE_STRIPE_ACCOUNT_ID,
  apiVersion: "2023-10-16",
  locale: "en",
});

// Log when Stripe promise resolves or rejects
stripePromise.then(
  (stripe) => console.log("Stripe loaded successfully:", !!stripe),
  (error) => console.error("Failed to load Stripe:", error),
);

export function StripeProvider({
  children,
  clientSecret,
}: {
  children: React.ReactNode;
  clientSecret?: string;
}) {
  useEffect(() => {
    console.log(
      "StripeProvider mounted with clientSecret:",
      clientSecret ? "Present" : "Missing",
    );
  }, [clientSecret]);

  if (!clientSecret) {
    console.error("Client secret is required for PaymentElement");
    throw new Error("Client secret is required for PaymentElement");
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#0570de",
        colorBackground: "#ffffff",
        colorText: "#30313d",
        colorDanger: "#df1b41",
        fontFamily: "Ideal Sans, system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "4px",
      },
    },
    loader: "auto" as const,
  };

  console.log("Initializing Stripe Elements with options:", {
    clientSecret: clientSecret ? "Present" : "Missing",
    appearance: options.appearance.theme,
    loader: options.loader,
  });

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
