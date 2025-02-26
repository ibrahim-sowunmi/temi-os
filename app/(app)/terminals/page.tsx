import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";

export default async function TerminalsPage() {
  const session = await auth();
  if (!session) return <div>Not authenticated</div>;

  // Fetch locations for the current merchant
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

  const locations = await prisma.location.findMany({
    where: {
      merchantId: merchant.id,
      active: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

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
      <h1 className="text-3xl font-bold mb-6">Terminals</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Terminal Management</h2>
        <p className="text-gray-600 mb-6">
          This is where you can deploy and manage your fleet of terminals. Configure your payment terminals, 
          assign them to locations, and track their status all in one place.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">Active Terminals</h3>
            <p className="text-gray-500 mb-2">You have {readers.length} active terminals</p>
            <Link href="/terminals/readers" className="text-blue-600 hover:underline">
              View all terminals
            </Link>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">Locations</h3>
            <p className="text-gray-500 mb-2">You have {locations.length} registered locations</p>
            <div className="mt-4 mb-3">
              {locations.slice(0, 3).map((location) => (
                <div key={location.id} className="mb-2">
                  <span className="font-medium">{location.displayName}</span>
                </div>
              ))}
              {locations.length > 3 && (
                <p className="text-sm text-gray-500">
                  +{locations.length - 3} more locations
                </p>
              )}
            </div>
            <Link href="/terminals/locations" className="text-blue-600 hover:underline">
              View all locations
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Link href="/terminals/readers" className="bg-white rounded-lg shadow-md p-6 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Terminal Readers</h2>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 mt-2">
            View and manage all your payment terminal readers. Each reader can be configured with custom settings.
          </p>
        </Link>
        
        <Link href="/terminals/locations" className="bg-white rounded-lg shadow-md p-6 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Locations</h2>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 mt-2">
            Manage your business locations. Each location can have multiple terminal readers assigned to it.
          </p>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Recent Terminal Readers</h2>
          <Link href="/terminals/readers" className="text-blue-600 hover:underline">
            View All Readers
          </Link>
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {readers.slice(0, 5).map((reader) => (
                  <tr key={reader.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{reader.name}</td>
                    <td className="px-4 py-3 text-sm">{reader.location?.displayName || 'N/A'}</td>
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