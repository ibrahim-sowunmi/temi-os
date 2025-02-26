import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";

export default async function LocationsPage() {
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

  // Fetch all locations for this merchant
  const locations = await prisma.location.findMany({
    where: {
      merchantId: merchant.id
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      terminals: true
    }
  });

  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <Link href="/terminals" className="text-blue-600 hover:underline mr-4">
          &larr; Back to Terminals
        </Link>
        <h1 className="text-3xl font-bold">Locations</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <p className="text-gray-600">
            Manage your business locations. Each location can have multiple terminal readers assigned to it.
          </p>
        </div>
        
        {locations.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p>No locations found</p>
            <p className="text-sm text-gray-500 mt-2">
              Locations will appear here once you create them
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Display Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Address</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Terminal Count</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{location.displayName}</td>
                    <td className="px-4 py-3 text-sm">
                      {typeof location.address === 'object' && (
                        <div>
                          <div>{(location.address as any).city}, {(location.address as any).state}</div>
                          <div className="text-xs text-gray-500">{(location.address as any).country}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{location.terminals.length}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        location.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {location.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/terminals/locations/${location.id}`} className="text-blue-600 hover:underline">
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