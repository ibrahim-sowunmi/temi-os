'use client';

export default function StripeUpdateButton() {
  const handleUpdate = async () => {
    try {
      const response = await fetch('/api/stripe/connect/onboard-account', {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start account update');
      }
      
      const { accountLink } = await response.json();
      window.open(accountLink, '_blank');
    } catch (error) {
      console.error('Error starting account update:', error);
      alert('Failed to start account update process');
    }
  };

  return (
    <button
      onClick={handleUpdate}
      className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block ml-4"
    >
      Update Stripe Account
    </button>
  );
} 