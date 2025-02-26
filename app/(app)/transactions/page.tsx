import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import StripeConnectWrapper from "@/app/components/stripe/StripeConnectWrapper";

async function getMerchantInfo(email: string) {
  try {
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: email
        }
      },
      select: {
        id: true,
        stripeConnectId: true,
        isOnboarded: true
      }
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    return merchant;
  } catch (error) {
    console.error('Failed to fetch merchant info:', error);
    return null;
  }
}

export default async function TransactionsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-red-500">You need to be logged in to view your transactions.</p>
        </div>
      </div>
    );
  }

  const merchantData = await getMerchantInfo(session.user.email);
  
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {!merchantData || !merchantData.stripeConnectId ? (
          <div>
            <p className="text-gray-600 mb-4">
              You need to connect your Stripe account to view transactions.
            </p>
            <a 
              href="/merchant" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set up Stripe Account
            </a>
          </div>
        ) : !merchantData.isOnboarded ? (
          <div>
            <p className="text-gray-600 mb-4">
              Please complete your Stripe onboarding to view transactions.
            </p>
            <a 
              href="/settings/account" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Complete Onboarding
            </a>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              View and manage your transaction history.
            </p>
            
            <StripeConnectWrapper
              connectedAccountId={merchantData.stripeConnectId}
              componentType="payments"
              title="Transactions"              
              additionalProps={{
                // Optional default filters
                // defaultFilters: {
                //   status: ['succeeded', 'pending', 'failed'],
                //   date: { after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
                // }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 