"use client";

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteWorkerButtonProps {
  workerId: string;
  workerName: string;
}

export default function DeleteWorkerButton({ workerId, workerName }: DeleteWorkerButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!workerId) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/worker?id=${workerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete worker');
      }
      
      // Redirect to workers page after successful deletion
      router.push('/workers');
      router.refresh();
    } catch (error) {
      console.error('Error deleting worker:', error);
      alert('Failed to delete worker. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
        title="Delete worker"
      >
        <Trash2 size={18} />
      </button>
      
      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Worker</h3>
            <p className="mb-4">
              Are you sure you want to delete worker <span className="font-semibold">{workerName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 