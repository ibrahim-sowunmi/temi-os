import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma";
import { redirect } from 'next/navigation';
import MerchantForm from './MerchantForm';
import { User } from "@prisma/client";

export default async function MerchantPage() {
  const session = await auth();

  const userSessionId = session?.user?.id;

  // if (!userSessionId) {
  //   // Check if user already has a merchant profile
  //   const merchant = await prisma.merchant.findUnique({
  //     where: {
  //       userId: userSessionId
  //     },
  //     select: {
  //       id: true
  //     }
  //   });

  //   if (merchant) {
  //     redirect('/dashboard');
  //   }
  // }

  // if (merchant) {
  //   redirect('/dashboard');
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl text-center font-bold text-gray-900">
            <a href="/dashboard" className="hover:underline">
              Temi OS Merchant Registration
            </a>
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <MerchantForm user={session?.user} />
        </div>
      </main>
    </div>
  );
}