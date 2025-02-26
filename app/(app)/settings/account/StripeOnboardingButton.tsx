'use client';

export default function StripeOnboardingButton() {
  const handleOnboard = async () => {
    try {
      const response = await fetch('/api/stripe/connect/onboard-account', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start onboarding');
      }
      
      const { accountLink } = await response.json();
      window.open(accountLink, '_blank');
    } catch (error) {
      console.error('Error starting onboarding:', error);
      alert('Failed to start onboarding process');
    }
  };

  return (
    <button
      onClick={handleOnboard}
      className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
    >
      Complete Stripe Onboarding
    </button>
  );
} 