import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProtectedClientComponent } from "@/app/components/ProtectedClientComponent";
import { WorkerDeployCard } from "@/app/components/WorkerDeployCard";

// Import these from components directory if they exist, or they'll need to be created
import EditWorkerButton from "../components/EditWorkerButton";
import DeleteWorkerButton from "../components/DeleteWorkerButton";

interface WorkerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkerDetailPage({ params }: WorkerDetailPageProps) {
  // In Next.js 15, params is async and needs to be awaited
  const awaitedParams = await params;
  
  const session = await auth();
  if (!session) return <div>Not authenticated</div>;

  const workerId = awaitedParams.id;

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

  // Get the worker with its relations
  const worker = await prisma.worker.findUnique({
    where: {
      id: workerId,
      merchantId: merchant.id // Ensure worker belongs to requesting merchant
    },
    include: {
      locations: {
        select: {
          id: true,
          displayName: true
        }
      },
      merchant: {
        select: {
          id: true,
          businessName: true
        }
      }
    }
  });

  if (!worker) {
    return notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-2">
        <Link href="/workers" className="flex items-center text-blue-600 hover:underline w-fit">
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Workers</span>
        </Link>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{worker.name || "Worker"}</h1>
        <div className="flex gap-2">
          <ProtectedClientComponent>
            <EditWorkerButton worker={worker} />
          </ProtectedClientComponent>
          <ProtectedClientComponent>
            <DeleteWorkerButton workerId={worker.id} workerName={worker.name} />
          </ProtectedClientComponent>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - Main details */}
        <div className="md:col-span-7">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Worker Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Worker ID</div>
                <div>{worker.id}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Agent ID</div>
                <div>{worker.agentId}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Voice ID</div>
                <div>{worker.voiceId || "Not specified"}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Language</div>
                <div>{worker.language}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Merchant</div>
                <div>{worker.merchant.businessName}</div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm text-gray-500">Created At</div>
                <div>{new Date(worker.createdAt).toLocaleString()}</div>
              </div>
              <div className="pb-3">
                <div className="text-sm text-gray-500">Updated At</div>
                <div>{new Date(worker.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* First Message */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">First Message</h2>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="whitespace-pre-wrap">{worker.firstMessage || "Default welcome message will be used."}</p>
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Prompt</h2>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <p className="whitespace-pre-wrap">{worker.prompt || "No specific prompt configured."}</p>
            </div>
          </div>
        </div>

        {/* Right column - Associated locations and deploy card */}
        <div className="md:col-span-5">
          {/* Locations section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Assigned Locations</h2>
              <span className="text-sm text-gray-500">{worker.locations.length} locations</span>
            </div>
            
            {worker.locations.length === 0 ? (
              <div className="text-center py-6 border rounded-lg">
                <p>No locations assigned</p>
                <p className="text-sm text-gray-500 mt-2">
                  Worker needs to be assigned to locations to be deployed there
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {worker.locations.map((location) => (
                  <div 
                    key={location.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">{location.displayName || "Unnamed Location"}</div>
                      <Link 
                        href={`/terminals/locations/${location.id}`} 
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Location
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deploy Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Deploy Worker</h2>
            <WorkerDeployCard 
              worker={worker} 
              merchantName={worker.merchant.businessName} 
            />
          </div>
        </div>
      </div>
    </div>
  );
} 