"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteKnowledgeBaseButtonProps {
  id: string;
  title: string;
}

export default function DeleteKnowledgeBaseButton({ id, title }: DeleteKnowledgeBaseButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    // Reset error state when closing
    setTimeout(() => {
      setError("");
    }, 300); // Wait for animation to finish
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/knowledge?id=${id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete knowledge base");
      }
      
      // Close the modal and navigate back to the knowledge base list
      closeModal();
      router.push("/knowledge");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center justify-center rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </button>
      
      {/* Modal backdrop and container with transition */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ease-in-out ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
        onClick={closeModal}
      >
        {/* Backdrop with transition */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0'}`}
        />
        
        {/* Sidebar with slide animation */}
        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <div 
            className={`relative w-screen max-w-md transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full bg-white shadow-xl flex flex-col overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Delete Knowledge Base</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete the knowledge base <strong>"{title}"</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone. All content and attachments related to this knowledge base will be permanently removed.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-auto">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 