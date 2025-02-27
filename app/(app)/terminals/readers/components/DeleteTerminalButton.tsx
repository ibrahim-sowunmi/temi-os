"use client";

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteTerminalButtonProps {
  readerId: string;
  readerName: string;
}

export function DeleteTerminalButton({ readerId, readerName }: DeleteTerminalButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/stripe/terminal/readers?readerId=${readerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete reader');
      }

      // Success - navigate to readers list
      router.push('/terminals/readers');
    } catch (error) {
      console.error('Error deleting reader:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete reader');
      setIsDeleting(false);
      // Keep modal open to show error
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        aria-label="Delete reader"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 md:mx-0">
            <h3 className="text-lg font-bold mb-4">Confirm Reader Deletion</h3>
            
            <p className="mb-4">
              Are you sure you want to delete <strong>{readerName || "this reader"}</strong>?
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Reader'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 