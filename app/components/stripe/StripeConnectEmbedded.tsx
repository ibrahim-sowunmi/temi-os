'use client';

import { useState, useEffect } from 'react';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { 
  ConnectComponentsProvider,
  ConnectAccountManagement,
  ConnectPayments,
  ConnectPaymentDetails,
  ConnectPayouts,
  ConnectPayoutsList,
  ConnectTaxSettings,
  ConnectBalances
} from '@stripe/react-connect-js';
import { StripeComponentType } from '@/app/lib/stripe-components';

interface StripeConnectEmbeddedProps {
  connectedAccountId: string | null;
  componentType: StripeComponentType;
  paymentId?: string; // For payment_details component
  additionalProps?: Record<string, any>; // For any additional component-specific props
}

export default function StripeConnectEmbedded({ 
  connectedAccountId, 
  componentType,
  paymentId,
  additionalProps = {}
}: StripeConnectEmbeddedProps) {
  const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  useEffect(() => {
    if (!connectedAccountId) {
      setLoading(false);
      return;
    }

    const initializeStripe = async () => {
      try {
        const fetchClientSecret = async () => {
          const response = await fetch('/api/stripe/connect/account-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              connectedAccountId,
              componentType 
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get account session');
          }

          const { client_secret: clientSecret } = await response.json();
          return clientSecret;
        };

        // Note: Console errors about r.stripe.com being blocked by ad blockers 
        // can be safely ignored as they don't affect functionality
        const stripeInstance = await loadConnectAndInitialize({
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          fetchClientSecret,
        });

        setStripeConnectInstance(stripeInstance);
      } catch (err) {
        setError((err as Error).message || 'Failed to initialize Stripe');
        console.error('Error initializing Stripe Connect:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, [connectedAccountId, componentType]);

  if (loading) {
    return <div className="flex justify-center items-center p-4">Loading Stripe Connect...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (!stripeConnectInstance) {
    return <div className="text-amber-500 p-4">Unable to initialize Stripe Connect.</div>;
  }

  // Render the appropriate component based on componentType
  const renderComponent = () => {
    switch (componentType) {
      case 'account_management':
        return <ConnectAccountManagement {...additionalProps} />;
      
      case 'balances':
        return <ConnectBalances {...additionalProps} />;
      
      case 'payments':
        return <ConnectPayments {...additionalProps} />;
      
      case 'payment_details':
        if (!paymentId) {
          return (
            <div>
              <button 
                onClick={() => setIsDetailsVisible(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Show Payment Details
              </button>
              {isDetailsVisible && paymentId && (
                <ConnectPaymentDetails 
                  payment={paymentId} 
                  onClose={() => setIsDetailsVisible(false)}
                  {...additionalProps}
                />
              )}
            </div>
          );
        }
        return <div className="text-red-500">Payment ID is required for payment details</div>;
      
      case 'payouts':
        return <ConnectPayouts {...additionalProps} />;
      
      case 'payouts_list':
        return <ConnectPayoutsList {...additionalProps} />;
      
      case 'tax_settings':
        return <ConnectTaxSettings {...additionalProps} />;
      
      default:
        return <div>Unknown component type: {componentType}</div>;
    }
  };

  return (
    <div className="w-full mt-4">
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        {renderComponent()}
      </ConnectComponentsProvider>
    </div>
  );
} 