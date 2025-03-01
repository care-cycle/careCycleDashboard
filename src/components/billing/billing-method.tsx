import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard as CardIcon, Plus, Loader2 } from "lucide-react";
import { StripeProvider } from "./stripe-provider";
import { PaymentMethodForm } from "./payment-method-form";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";

interface PaymentMethod {
  last4: string;
  expMonth: number;
  expYear: number;
  brand: string;
  id?: string;
}

interface BillingMethodProps {
  clientId: string;
  paymentMethod?:
    | PaymentMethod
    | {
        id: string;
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
      };
  onPaymentMethodChange: () => void;
}

export function BillingMethod({
  clientId,
  paymentMethod,
  onPaymentMethodChange,
}: BillingMethodProps) {
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Normalize payment method format
  const normalizedPaymentMethod =
    paymentMethod && "exp_month" in paymentMethod
      ? paymentMethod
      : paymentMethod && "expMonth" in paymentMethod
        ? {
            id: paymentMethod.id || "",
            brand: paymentMethod.brand,
            last4: paymentMethod.last4,
            exp_month: paymentMethod.expMonth,
            exp_year: paymentMethod.expYear,
          }
        : undefined;

  // Fetch client secret when adding a payment method
  useEffect(() => {
    if (isAddingPaymentMethod && !clientSecret) {
      fetchClientSecret();
    }
  }, [isAddingPaymentMethod, clientSecret]);

  const fetchClientSecret = async () => {
    setIsLoading(true);
    try {
      // Use the API client instead of direct fetch
      const response = await apiClient.post("/stripe/createIntent", {
        clientId,
      });
      setClientSecret(response.data.clientSecret);
    } catch (error) {
      console.error("Error fetching client secret:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize payment form. Please try again.",
      });
      setIsAddingPaymentMethod(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    setIsAddingPaymentMethod(true);
  };

  const handlePaymentMethodSuccess = async (paymentMethodId: string) => {
    try {
      // Use the API client instead of direct fetch
      await apiClient.post("/portal/payment-method", {
        clientId,
        paymentMethodId,
      });

      // Reset state and notify parent component
      setIsAddingPaymentMethod(false);
      setClientSecret(null);
      onPaymentMethodChange();

      toast({
        title: "Success",
        description: "Payment method has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating payment method:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment method. Please try again.",
      });
    }
  };

  const handleCancel = () => {
    setIsAddingPaymentMethod(false);
    setClientSecret(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>
          Manage your payment method for billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAddingPaymentMethod ? (
          isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Initializing payment form...</span>
            </div>
          ) : clientSecret ? (
            <StripeProvider clientSecret={clientSecret}>
              <PaymentMethodForm
                onSuccess={handlePaymentMethodSuccess}
                onCancel={handleCancel}
                clientSecret={clientSecret}
              />
            </StripeProvider>
          ) : (
            <div className="text-center p-4">
              Failed to initialize payment form. Please try again.
            </div>
          )
        ) : normalizedPaymentMethod ? (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Card:</span>
              <span>
                {normalizedPaymentMethod.brand.charAt(0).toUpperCase() +
                  normalizedPaymentMethod.brand.slice(1)}{" "}
                ending in {normalizedPaymentMethod.last4}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Expires:</span>
              <span>
                {normalizedPaymentMethod.exp_month.toString().padStart(2, "0")}/
                {normalizedPaymentMethod.exp_year.toString().slice(-2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            No payment method on file. Add a payment method to continue.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {!isAddingPaymentMethod && (
          <Button onClick={handleAddPaymentMethod}>
            {normalizedPaymentMethod
              ? "Update Payment Method"
              : "Add Payment Method"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
