import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import StripeOnboardingButton from "./StripeOnboardingButton"
import StripeUpdateButton from "./StripeUpdateButton"


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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
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
                  </div>
                ) : (
                  <StripeOnboardingButton />
                )}
              </div>
            ) : (
              <p className="text-yellow-600 mt-4">Not connected to Stripe</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ session, merchantData }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 