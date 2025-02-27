import { auth } from "@/auth";
import { prisma } from "@/prisma";
import AddWorkerButton from "./components/AddWorkerButton";
import DeleteWorkerButton from "./components/DeleteWorkerButton";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";

export default async function WorkersPage() {
  const session = await auth();
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Unauthorized</h1>
        <p>Please sign in to view workers.</p>
      </div>
    );
  }

  // Find the merchant for the current user
  const merchant = await prisma.merchant.findFirst({
    where: {
      user: {
        email: session.user.email
      }
    }
  });

  if (!merchant) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Merchant Account Required</h1>
        <p>You need to create a merchant account to manage workers.</p>
      </div>
    );
  }

  // Fetch all workers for this merchant
  const workers = await prisma.worker.findMany({
    where: {
      merchantId: merchant.id
    },
    include: {
      locations: {
        select: {
          id: true,
          displayName: true
        }
      },
      _count: {
        select: {
          locations: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workers</h1>
        <AddWorkerButton />
      </div>
      
      {workers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No workers yet</h3>
          <p className="text-gray-500 mb-6">Create your first worker to help manage customer interactions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <div 
              key={worker.id} 
              className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-5 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold line-clamp-1">{worker.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Language: {worker.language}
                    </p>
                  </div>
                  <DeleteWorkerButton workerId={worker.id} workerName={worker.name} />
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <MapPin size={16} className="mr-1" />
                  <span>{worker._count.locations} Locations</span>
                </div>
                
                {worker.agentId && (
                  <div className="text-sm text-gray-500 mb-3">
                    <span className="font-medium">Agent ID:</span> {worker.agentId}
                  </div>
                )}
                
                {worker.voiceId && (
                  <div className="text-sm text-gray-500 mb-3">
                    <span className="font-medium">Voice ID:</span> {worker.voiceId}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500 mt-4">
                  <Clock size={16} className="mr-1" />
                  <span>Updated {new Date(worker.updatedAt).toLocaleDateString()}</span>
                </div>
                
                <div className="mt-4">
                  <Link 
                    href={`/workers/${worker.id}`} 
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 