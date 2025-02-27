"use client";

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteWorkerButtonProps {
  workerId: string;
  workerName: string;
}

export default function DeleteWorkerButton({ workerId, workerName }: DeleteWorkerButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const handleOpenConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmOpen(true);
  };
  
  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setError(null);
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      console.log(`Attempting to delete worker: ${workerId}`);
      
      const response = await fetch(`/api/worker?id=${workerId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete worker');
      }
      
      console.log('Worker successfully deleted');
      
      // Close the modal and refresh the page to update the list
      handleCloseConfirm();
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting worker:', error);
      setError(error.message || 'An error occurred while deleting the worker');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <>
      <button
        onClick={handleOpenConfirm}
        className="text-gray-500 hover:text-red-500 transition-colors p-1"
        title="Delete worker"
      >
        <Trash2 size={18} />
      </button>
      
      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={handleCloseConfirm}
          ></div>
          
          {/* Modal */}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto z-10 relative">
            <h3 className="text-lg font-semibold mb-4">Delete Worker</h3>
            
            <p className="mb-4">
              Are you sure you want to delete <span className="font-semibold">{workerName}</span>? 
              This action cannot be undone.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseConfirm}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 