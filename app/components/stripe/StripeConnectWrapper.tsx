'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { StripeComponentType } from '@/app/lib/stripe-components';

// Dynamically import the StripeConnectEmbedded component with SSR disabled
const StripeConnectEmbedded = dynamic(
  () => import('./StripeConnectEmbedded'),
  { ssr: false }
);

interface StripeConnectWrapperProps {
  connectedAccountId: string | null;
  componentType: StripeComponentType;
  title?: string;
  description?: string;
  paymentId?: string;
  additionalProps?: Record<string, any>;
  className?: string;
}

export default function StripeConnectWrapper({ 
  connectedAccountId,
  componentType,
  title,
  description,
  paymentId,
  additionalProps,
  className = ''
}: StripeConnectWrapperProps) {
  if (!connectedAccountId) {
    return null;
  }

  return (
    <div className={`mt-6 pt-4 border-t border-gray-200 ${className}`}>
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      <StripeConnectEmbedded 
        connectedAccountId={connectedAccountId} 
        componentType={componentType}
        paymentId={paymentId}
        additionalProps={additionalProps}
      />
    </div>
  );
} 