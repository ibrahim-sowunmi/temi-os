import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteTerminalButton } from "../components/DeleteTerminalButton";
import { ChevronLeft } from "lucide-react";
import EditTerminalButton from "../components/EditTerminalButton";
import { ProtectedClientComponent } from "@/app/components/ProtectedClientComponent";

interface ReaderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReaderDetailPage({ params }: ReaderDetailPageProps) {
  const session = await auth();
  if (!session) return <div>Not authenticated</div>;

  // Helper function to format last seen text
  function getLastSeenText(lastSeenDate: Date) {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(lastSeenDate).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  }

  // Properly await params before accessing
  const resolvedParams = await params;
  const readerId = resolvedParams.id;
  
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

  // Get the reader with its relations
  const reader = await prisma.terminal.findUnique({
    where: {
      id: readerId,
      merchantId: merchant.id // Ensure reader belongs to requesting merchant
    },
    include: {
      location: true,
      knowledgeBase: true
    }
  });

  if (!reader) {
    return notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-2">
        <Link href="/terminals/readers" className="flex items-center text-blue-600 hover:underline w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Readers</span>
        </Link>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{reader.name || "Terminal Reader"}</h1>
        <div className="flex gap-2">
          <ProtectedClientComponent>
            <EditTerminalButton terminal={reader} />
          </ProtectedClientComponent>
          <ProtectedClientComponent>
            <DeleteTerminalButton readerId={reader.id} readerName={reader.name || ""} />
          </ProtectedClientComponent>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - Main details */}
        <div className="md:col-span-8">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Reader Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Reader ID</div>
                <div>{reader.id}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Stripe Reader ID</div>
                <div>{reader.stripeTerminalId}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Name</div>
                <div>{reader.name || "Unnamed"}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Description</div>
                <div>{reader.description || "No description provided"}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Voice</div>
                <div>{reader.voice || "Default voice"}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Device Type</div>
                <div className="flex items-center">
                  {reader.deviceType || "Unknown"}
                  {reader.deviceType && (
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reader.deviceType.includes('simulated') 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {reader.deviceType.includes('simulated') ? 'Simulated' : 'Physical'}
                    </span>
                  )}
                </div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Last Seen</div>
                <div>
                  {reader.lastSeenAt 
                    ? new Date(reader.lastSeenAt).toLocaleString() 
                    : "Never connected"}
                  {reader.lastSeenAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {getLastSeenText(reader.lastSeenAt)}
                    </div>
                  )}
                </div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Created At</div>
                <div>{new Date(reader.createdAt).toLocaleString()}</div>
              </div>
              <div className="pb-3">
                <div className="text-sm text-gray-500">Updated At</div>
                <div>{new Date(reader.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Additional information */}
        <div className="md:col-span-4">
          {/* Location Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            {reader.location ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Display Name</div>
                  <div className="font-medium">{reader.location.displayName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="text-sm">
                    {typeof reader.location.address === 'object' && (
                      <>
                        <div>{(reader.location.address as any).line1}</div>
                        <div>
                          {(reader.location.address as any).city}, {(reader.location.address as any).state} {(reader.location.address as any).postalCode}
                        </div>
                        <div>{(reader.location.address as any).country}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No location assigned</p>
            )}
          </div>

          {/* Knowledge Base Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Knowledge Base</h2>
            {reader.knowledgeBase ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Title</div>
                  <div className="font-medium">{reader.knowledgeBase.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tags</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reader.knowledgeBase.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className={`text-sm ${reader.knowledgeBase.active ? 'text-green-600' : 'text-red-600'}`}>
                    {reader.knowledgeBase.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No knowledge base assigned</p>
            )}
          </div>

          {/* Overrides */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Overrides</h2>
            {reader.overrides ? (
              <div>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(reader.overrides, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500">No overrides configured</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 