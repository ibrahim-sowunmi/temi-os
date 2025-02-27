"use client";

import { useState, useEffect } from 'react';
import { Edit, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TerminalData {
  id: string;
  name: string | null;
  stripeTerminalId: string;
  knowledgeBaseId: string | null;
  locationId: string | null;
  location?: {
    id: string;
    displayName: string;
  };
  knowledgeBase?: {
    id: string;
    title: string;
  } | null;
}

interface EditTerminalButtonProps {
  terminal: TerminalData;
}

export default function EditTerminalButton({ terminal }: EditTerminalButtonProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        handleCloseSidebar();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  // Handle scrolling behavior
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const handleOpenSidebar = () => {
    setIsAnimating(true);
    setIsSidebarOpen(true);
    loadLocations();
    loadKnowledgeBases();
  };

  const handleCloseSidebar = () => {
    setIsAnimating(true);
    setIsSidebarOpen(false);
  };

  const handleAnimationEnd = () => {
    setIsAnimating(false);
  };

  // Form state
  const [formData, setFormData] = useState({
    label: terminal.name || "",
    locationId: terminal.locationId || "",
    knowledgeBaseId: terminal.knowledgeBaseId || ""
  });

  // Locations for dropdown
  const [locations, setLocations] = useState<Array<{id: string, displayName: string}>>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  const loadLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const response = await fetch('/api/stripe/terminal/locations');
      if (!response.ok) {
        throw new Error('Failed to load locations');
      }
      const data = await response.json();
      // Only show active locations
      const activeLocations = data.filter((loc: any) => loc.active);
      setLocations(activeLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
      setFormError('Failed to load locations. Please try again.');
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Knowledge bases for dropdown
  const [knowledgeBases, setKnowledgeBases] = useState<Array<{id: string, title: string}>>([]);
  const [isLoadingKnowledgeBases, setIsLoadingKnowledgeBases] = useState(false);

  const loadKnowledgeBases = async () => {
    setIsLoadingKnowledgeBases(true);
    try {
      const response = await fetch('/api/knowledge-bases');
      if (!response.ok) {
        throw new Error('Failed to load knowledge bases');
      }
      const data = await response.json();
      // Only show active knowledge bases
      const activeKnowledgeBases = data.filter((kb: any) => kb.active);
      setKnowledgeBases(activeKnowledgeBases);
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
      // Don't set form error, as this is optional
    } finally {
      setIsLoadingKnowledgeBases(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Prepare data for API - only send what's changed
      const apiData: any = {};
      
      if (formData.label !== terminal.name) {
        apiData.label = formData.label;
      }
      
      if (formData.locationId !== terminal.locationId) {
        apiData.locationId = formData.locationId;
      }
      
      // For knowledge base, handle null case correctly
      if (formData.knowledgeBaseId !== terminal.knowledgeBaseId) {
        apiData.knowledgeBaseId = formData.knowledgeBaseId || null;
      }

      // Skip API call if nothing changed
      if (Object.keys(apiData).length === 0) {
        handleCloseSidebar();
        return;
      }

      // Send to API
      const response = await fetch(`/api/stripe/terminal/readers?readerId=${terminal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to update terminal reader');
      }

      // Success - close sidebar and refresh
      handleCloseSidebar();
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error('Error updating terminal:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to update terminal reader');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenSidebar}
        className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
      >
        <Edit className="w-4 h-4" />
        <span>Edit</span>
      </button>

      {/* Sidebar Modal with Animation */}
      <div 
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ease-in-out ${isSidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
        aria-hidden={!isSidebarOpen}
      >
        {/* Backdrop with fade effect */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${isSidebarOpen ? 'bg-opacity-50' : 'bg-opacity-0'}`}
          onClick={handleCloseSidebar}
        />
        
        {/* Sliding sidebar */}
        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <div 
            className={`relative w-screen max-w-md transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
            onTransitionEnd={handleAnimationEnd}
          >
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-6 border-b">
                <h2 className="text-xl font-semibold text-left">Edit Terminal Reader</h2>
                <button 
                  onClick={handleCloseSidebar}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 p-6 text-left">
                {formError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {formError}
                  </div>
                )}

                <div className="bg-gray-100 rounded-md p-3 mb-4">
                  <p className="text-sm text-gray-600">
                    Terminal ID: <span className="font-mono">{terminal.id}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Stripe Terminal ID: <span className="font-mono">{terminal.stripeTerminalId}</span>
                  </p>
                </div>

                {/* Label */}
                <div className="mb-4">
                  <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                    Name/Label
                  </label>
                  <input
                    type="text"
                    id="label"
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a label for this terminal"
                  />
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  
                  {isLoadingLocations ? (
                    <div className="text-sm text-gray-500">Loading locations...</div>
                  ) : locations.length === 0 ? (
                    <div className="text-sm text-red-500">
                      No active locations found.
                    </div>
                  ) : (
                    <select
                      id="locationId"
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">None</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.displayName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Knowledge Base */}
                <div className="mb-6">
                  <label htmlFor="knowledgeBaseId" className="block text-sm font-medium text-gray-700 mb-1">
                    Knowledge Base
                  </label>
                  
                  {isLoadingKnowledgeBases ? (
                    <div className="text-sm text-gray-500">Loading knowledge bases...</div>
                  ) : (
                    <select
                      id="knowledgeBaseId"
                      name="knowledgeBaseId"
                      value={formData.knowledgeBaseId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">None</option>
                      {knowledgeBases.map(kb => (
                        <option key={kb.id} value={kb.id}>
                          {kb.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Assign a knowledge base to this terminal
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Terminal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 