import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

/**
 * Payment Method Form using Stripe Elements
 *
 * Note: You may see console errors like "POST https://r.stripe.com/b net::ERR_BLOCKED_BY_CLIENT"
 * These are related to Stripe's telemetry/analytics being blocked by ad blockers or privacy extensions.
 * They don't affect the core payment functionality and can be safely ignored.
 */
interface PaymentMethodFormProps {
  onSuccess: (paymentMethod: any) => void;
  onCancel: () => void;
  clientSecret: string;
}

export function PaymentMethodForm({
  onSuccess,
  onCancel,
  clientSecret,
}: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    console.log(
      "PaymentMethodForm mounted with clientSecret:",
      clientSecret ? "Present" : "Missing",
    );

    if (stripe) {
      console.log("Stripe initialized successfully");
    } else {
      console.log("Stripe not yet initialized");
    }
  }, [stripe, clientSecret]);

  useEffect(() => {
    if (!clientSecret) {
      console.error("Client secret is missing");
      setErrorMessage("Client secret is required");
    } else {
      console.log("Client secret is available");
      setErrorMessage(undefined);
    }
  }, [clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");

    if (!stripe || !elements || !clientSecret) {
      console.error("Cannot submit form:", {
        stripe: !!stripe,
        elements: !!elements,
        clientSecret: !!clientSecret,
      });
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      console.log("Confirming setup with client secret");
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing`,
        },
        redirect: "if_required",
      });

      console.log("Setup confirmation result:", result);

      if (result.error) {
        // Show error to your customer
        console.error("Stripe error:", result.error);
        setErrorMessage(result.error.message);
        toast({
          variant: "destructive",
          title: "Payment setup failed",
          description: result.error.message,
        });
      } else {
        // The setup has succeeded
        if (result.setupIntent && result.setupIntent.status === "succeeded") {
          console.log("Setup intent succeeded:", result.setupIntent);
          toast({
            title: "Payment method added",
            description: "Your payment method has been successfully added.",
          });

          // Fetch the payment method details to pass to onSuccess
          const paymentMethod = result.setupIntent.payment_method;
          onSuccess(paymentMethod);
        } else {
          // Handle other statuses or redirect the customer
          console.log("Setup intent status:", result.setupIntent?.status);
          toast({
            title: "Setup in progress",
            description: "Your payment setup is being processed.",
          });
        }
      }
    } catch (error) {
      console.error("Error confirming setup:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Payment setup failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      <PaymentElement
        options={{
          layout: {
            type: "tabs",
            defaultCollapsed: false,
          },
          fields: {
            billingDetails: {
              address: {
                country: "never",
              },
            },
          },
        }}
      />

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !stripe || !elements}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Add Payment Method"
          )}
        </Button>
      </div>
    </form>
  );
}
