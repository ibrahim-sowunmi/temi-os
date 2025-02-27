import React from 'react';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { WorkerDeployCard } from '@/app/components/WorkerDeployCard';

// Define interfaces for TypeScript
interface Merchant {
  id: string;
  businessName: string;
}

interface Worker {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  agentId: string;
  language: string;
  firstMessage: string | null;
  prompt: string | null;
  voiceId: string | null;
  merchantId: string;
  merchant: Merchant;
}

async function getWorkers() {
  const session = await auth();
  if (!session?.user?.email) {
    return [];
  }

  // Get the merchant data for the current user
  const merchant = await prisma.merchant.findFirst({
    where: {
      user: {
        email: session.user.email
      }
    }
  });

  if (!merchant) {
    return [];
  }

  // Get all workers for this merchant
  const workers = await prisma.worker.findMany({
    where: {
      merchantId: merchant.id
    },
    include: {
      merchant: {
        select: {
          id: true,
          businessName: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return workers;
}

export default async function DeployPage() {
  const workers = await getWorkers();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Deploy Worker</h1>
      <p className="text-gray-600 mb-6">Select a worker to deploy and test.</p>
      
      {workers.length === 0 ? (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-500">No workers found. Create workers first to deploy them.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Worker selection section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Select Worker</h2>
            <div className="grid gap-4">
              {workers.map((worker) => (
                <WorkerDeployCard 
                  key={worker.id} 
                  worker={worker}
                  merchantName={worker.merchant.businessName}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 