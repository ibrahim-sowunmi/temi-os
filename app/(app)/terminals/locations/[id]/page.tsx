import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProtectedClientComponent } from "@/app/components/ProtectedClientComponent";
import EditLocationButton from "../components/EditLocationButton";
import DeleteLocationButton from "../components/DeleteLocationButton";

interface LocationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  // In Next.js 15, params is async and needs to be awaited
  const awaitedParams = await params;
  
  const session = await auth();
  if (!session) return <div>Not authenticated</div>;

  const locationId = awaitedParams.id;

  // Get the merchant for the current user
  const merchant = await prisma.merchant.findFirst({
    where: {
      user: {
        email: session.user?.email || ""
      }
    }
  });

  if (!merchant) {
    return <div>Merchant account not found</div>;
  }

  // Get the location with its relations
  const location = await prisma.location.findUnique({
    where: {
      id: locationId,
      merchantId: merchant.id // Ensure location belongs to requesting merchant
    },
    include: {
      terminals: {
        include: {
          knowledgeBase: true
        }
      }
    }
  });

  if (!location) {
    return notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-2">
        <Link href="/terminals/locations" className="flex items-center text-blue-600 hover:underline w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Locations</span>
        </Link>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{location.displayName || "Location"}</h1>
        <div className="flex gap-2">
          <ProtectedClientComponent>
            <EditLocationButton location={location} />
          </ProtectedClientComponent>
          <ProtectedClientComponent>
            <DeleteLocationButton locationId={location.id} locationName={location.displayName} />
          </ProtectedClientComponent>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - Main details */}
        <div className="md:col-span-7">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Location Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Location ID</div>
                <div>{location.id}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Stripe Location ID</div>
                <div>{location.stripeLocationId}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Display Name</div>
                <div>{location.displayName}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Status</div>
                <div className={location.active ? 'text-green-600' : 'text-gray-500'}>
                  {location.active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Created At</div>
                <div>{new Date(location.createdAt).toLocaleString()}</div>
              </div>
              <div className="pb-3">
                <div className="text-sm text-gray-500">Updated At</div>
                <div>{new Date(location.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Address</h2>
            {typeof location.address === 'object' && (
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-500">Street</div>
                  <div>{(location.address as any).line1}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">City</div>
                    <div>{(location.address as any).city}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">State/Province</div>
                    <div>{(location.address as any).state}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Postal Code</div>
                    <div>{(location.address as any).postalCode}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Country</div>
                    <div>{(location.address as any).country}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Associated terminals */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Terminal Readers</h2>
              <span className="text-sm text-gray-500">{location.terminals.length} readers</span>
            </div>
            
            {location.terminals.length === 0 ? (
              <div className="text-center py-6 border rounded-lg">
                <p>No terminal readers at this location</p>
                <p className="text-sm text-gray-500 mt-2">
                  Terminal readers will appear here once assigned to this location
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {location.terminals.map((terminal) => (
                  <div 
                    key={terminal.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">{terminal.name || "Unnamed Reader"}</div>
                      <Link 
                        href={`/terminals/readers/${terminal.id}`} 
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Reader
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Voice:</span> {terminal.voice || "Default"}
                      </div>
                      <div>
                        <span className="text-gray-500">Knowledge Base:</span> {terminal.knowledgeBase ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 