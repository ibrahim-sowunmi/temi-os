import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ReaderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReaderDetailPage({ params }: ReaderDetailPageProps) {
  const session = await auth();
  if (!session) return <div>Not authenticated</div>;

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
      <div className="flex items-center mb-6">
        <Link href="/terminals/readers" className="text-blue-600 hover:underline mr-4">
          &larr; Back to Readers
        </Link>
        <h1 className="text-3xl font-bold">{reader.name || "Terminal Reader"}</h1>
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