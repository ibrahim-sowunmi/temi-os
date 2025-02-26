import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";

export default async function ReadersPage() {
  const session = await auth();
  if (!session) return <div>Not authenticated</div>;

  // Get the merchant data for the current user
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

  // Fetch all terminal readers for this merchant
  const readers = await prisma.terminal.findMany({
    where: {
      merchantId: merchant.id
    },
    include: {
      location: true,
      knowledgeBase: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <Link href="/terminals" className="text-blue-600 hover:underline mr-4">
          &larr; Back to Terminals
        </Link>
        <h1 className="text-3xl font-bold">Terminal Readers</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <p className="text-gray-600">
            This is where you can see all your readers. Each reader is associated with a location and can be configured with custom settings.
          </p>
        </div>
        
        {readers.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p>No terminal readers found</p>
            <p className="text-sm text-gray-500 mt-2">
              Terminal readers will appear here once you register them
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Knowledge Base</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Voice</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Overrides</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {readers.map((reader) => (
                  <tr key={reader.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{reader.name}</td>
                    <td className="px-4 py-3 text-sm">{reader.location?.displayName || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{reader.knowledgeBase ? reader.knowledgeBase.title : 'No'}</td>
                    <td className="px-4 py-3 text-sm">{reader.voice || 'Default'}</td>
                    <td className="px-4 py-3 text-sm">{reader.overrides ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/terminals/readers/${reader.id}`} className="text-blue-600 hover:underline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 