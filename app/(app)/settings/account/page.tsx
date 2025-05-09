import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import StripeOnboardingButton from "./StripeOnboardingButton"
import StripeUpdateButton from "./StripeUpdateButton"
import MerchantOffboardButton from "./MerchantOffboardButton"
import StripeConnectWrapper from "@/app/components/stripe/StripeConnectWrapper"

async function getMerchantInfo(email: string) {
  try {
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: email
        }
      },
      include: {
        terminals: true,
        products: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    return merchant;
  } catch (error) {
    console.error('Failed to fetch merchant info:', error)
    return null
  }
}

export default async function AccountPage() {
  const session = await auth()
  if (!session) return <div>Not authenticated</div>
  if (!session.user?.email) return <div>User email not found</div>

  const merchantData = await getMerchantInfo(session.user.email)
  if (!merchantData) return <div>Failed to load merchant data</div>

  return (
    <div className="w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow w-full">
          <h2 className="text-xl font-semibold mb-4">Merchant Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {merchantData.user.name}</p>
            <p><span className="font-medium">Email:</span> {merchantData.user.email}</p>
            <p><span className="font-medium">Total Products:</span> {merchantData.products.length}</p>
            <p><span className="font-medium">Total Terminals:</span> {merchantData.terminals.length}</p>
            
            {merchantData.stripeConnectId ? (
              <div className="mt-4">
                <p className="text-green-600 font-medium">✓ Connected to Stripe</p>
                {merchantData.isOnboarded ? (
                  <div>
                    <a
                      href="https://dashboard.stripe.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                    >
                      Go to Stripe Dashboard
                    </a>
                    <StripeUpdateButton />
                    
                    {/* Stripe Connect Embedded Component */}
                    <StripeConnectWrapper 
                      connectedAccountId={merchantData.stripeConnectId}
                      componentType="account_management"
                      title="Manage Your Stripe Account"
                      description="Update your bank accounts, payout settings, and other account details."
                    />
                  </div>
                ) : (
                  <StripeOnboardingButton />
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-yellow-600 mb-3">Not connected to Stripe</p>
                <p className="text-gray-600 mb-4">Connect your account with Stripe to start accepting payments and manage your business finances.</p>
                <StripeOnboardingButton />
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Account Management</h3>
              <p className="text-gray-500 mb-4">
                Remove your merchant account from the platform. This action cannot be undone.
              </p>
              <MerchantOffboardButton merchantId={merchantData.id} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow w-full">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded max-h-80 overflow-auto w-full text-sm">
            {JSON.stringify({ session, merchantData }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 