"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ProtectedClientComponentProps {
  children: React.ReactNode;
}

export function ProtectedClientComponent({ children }: ProtectedClientComponentProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // This effect ensures the component only renders on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything during server-side rendering
  if (!isClient) {
    return null;
  }

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push('/api/auth/signin');
    return (
      <div className="flex justify-center items-center p-4">
        <div className="text-red-500">You must be signed in to view this content</div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
} 