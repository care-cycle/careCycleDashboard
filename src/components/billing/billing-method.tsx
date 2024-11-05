import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard as CardIcon } from "lucide-react"
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from 'sonner' // Assuming you're using a toast library
import apiClient from '@/lib/api-client'
interface PaymentMethod {
  last4: string
  expMonth: number
  expYear: number
  brand: string
}

export function BillingMethod() {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)

  // Fetch existing payment method
  useEffect(() => {
    async function fetchClientInfo() {
      try {
        const response = await apiClient.get('/portal/client/info')
        const { stripe_customer_id, default_payment_method } = response.data
        
        if (default_payment_method) {
          setPaymentMethod({
            last4: default_payment_method.last4,
            expMonth: default_payment_method.exp_month,
            expYear: default_payment_method.exp_year,
            brand: default_payment_method.brand
          })
        }
      } catch (error) {
        toast.error('Failed to load payment information')
      }
    }
    fetchClientInfo()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      // Get setup intent from our API
      const response = await apiClient.post('/stripe/createIntent')
      const { clientSecret } = response.data

      // Confirm card setup with Stripe
      const { setupIntent, error } = await stripe!.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements!.getElement(CardElement)!,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // The webhook will handle saving the payment method
      setIsAdding(false)
      toast.success('Payment method added successfully')
      
      // Refresh payment method display
      const clientResponse = await apiClient.get('/portal/client/info')
      const { default_payment_method } = clientResponse.data
      
      if (default_payment_method) {
        setPaymentMethod({
          last4: default_payment_method.last4,
          expMonth: default_payment_method.exp_month,
          expYear: default_payment_method.exp_year,
          brand: default_payment_method.brand
        })
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Billing Method</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : isAdding ? (
          <form onSubmit={handleSubmit}>
            <CardElement />
            <Button type="submit">Add Payment Method</Button>
          </form>
        ) : paymentMethod ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gray-900 flex items-center justify-center">
                <CardIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium">{paymentMethod.brand} ending in {paymentMethod.last4}</p>
                <p className="text-sm text-gray-500">Expires {paymentMethod.expMonth}/{paymentMethod.expYear}</p>
              </div>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        ) : (
          <Button onClick={() => setIsAdding(true)}>Add Payment Method</Button>
        )}
      </CardContent>
    </Card>
  )
}