import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/app/lib/prisma';
import { User, Merchant } from '@prisma/client';

export default async function DashboardPage() {
  const session = await auth();

  // if user is not logged in, redirect to login page 
  if (!session?.user?.email) {
    redirect('/');
  }

  // Check if user has a merchant account
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { merchant: true }
  }) as (User & { merchant: Merchant | null }) | null;

  // if user does not have a merchant account, redirect to onboarding page
  if (!user?.merchant) {
    redirect('/merchant');
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">Total Sales</h2>
          <p className="text-3xl font-bold">$12,345</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">Active Terminals</h2>
          <p className="text-3xl font-bold">24</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2">Today's Orders</h2>
          <p className="text-3xl font-bold">156</p>
        </div>
      </div>
    </div>
  );
} 