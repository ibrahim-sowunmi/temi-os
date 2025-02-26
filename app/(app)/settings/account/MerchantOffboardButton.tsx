'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MerchantOffboardButtonProps {
  merchantId: string;
}

export default function MerchantOffboardButton({ merchantId }: MerchantOffboardButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleOffboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/merchant/offboard?merchantId=${merchantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to offboard merchant');
      }

      // Refresh page data
      router.refresh();
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {!isConfirmOpen ? (
        <button
          onClick={() => setIsConfirmOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
          type="button"
        >
          Remove Merchant Account
        </button>
      ) : (
        <div className="border border-red-200 bg-red-50 p-4 rounded-md">
          <p className="mb-4 text-red-800 font-medium">
            Are you sure you want to remove your merchant account? This action cannot be undone.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleOffboard}
              disabled={isLoading}
              className={`bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="button"
            >
              {isLoading ? 'Removing...' : 'Yes, Remove Merchant Account'}
            </button>
            <button
              onClick={() => setIsConfirmOpen(false)}
              disabled={isLoading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
              type="button"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
} 