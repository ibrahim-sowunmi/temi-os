"use client";

import { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddWorkerButton() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Array<{id: string, displayName: string}>>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
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
    setFormData({
      name: '',
      agentId: '',
      language: 'en',
      firstMessage: '',
      prompt: '',
      voiceId: '',
      locationIds: [],
    });
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
    name: '',
    agentId: '',
    language: 'en',
    firstMessage: '',
    prompt: '',
    voiceId: '',
    locationIds: [] as string[],
  });

  // Load location data
  const loadLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const response = await fetch('/api/stripe/terminal/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      console.log('Loaded locations:', data);
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle checkbox changes for locations
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const locationId = e.target.value;
    const isChecked = e.target.checked;
    
    setFormData(prev => {
      if (isChecked) {
        return {
          ...prev,
          locationIds: [...prev.locationIds, locationId]
        };
      } else {
        return {
          ...prev,
          locationIds: prev.locationIds.filter(id => id !== locationId)
        };
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    
    console.log('Submitting worker data:', formData);
    
    try {
      const response = await fetch('/api/worker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create worker');
      }
      
      console.log('Worker created successfully:', data);
      handleCloseSidebar();
      router.refresh(); // Refresh the page to show the new worker
    } catch (error: any) {
      console.error('Error creating worker:', error);
      setFormError(error.message || 'Failed to create worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenSidebar}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusCircle size={18} className="mr-2" />
        Add Worker
      </button>

      {/* Sidebar backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleCloseSidebar}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 w-full md:w-2/3 lg:w-1/2 xl:w-1/3 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add New Worker</h2>
          <button
            onClick={handleCloseSidebar}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
          {formError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Language Code
              </label>
              <input
                type="text"
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="en"
              />
              <p className="mt-1 text-sm text-gray-500">
                Two-letter language code (e.g., en, fr, es)
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="firstMessage" className="block text-sm font-medium text-gray-700 mb-2">
                First Message
              </label>
              <textarea
                id="firstMessage"
                name="firstMessage"
                value={formData.firstMessage}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Hello! How can I help you today?"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <textarea
                id="prompt"
                name="prompt"
                value={formData.prompt}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter specific instructions for the worker..."
              />
            </div>

            <div className="mb-6">
              <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-2">
                Voice ID
              </label>
              <input
                type="text"
                id="voiceId"
                name="voiceId"
                value={formData.voiceId}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locations
              </label>

              {isLoadingLocations ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : locations.length === 0 ? (
                <p className="text-gray-500">No locations available</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-gray-300 rounded-lg">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`location-${location.id}`}
                        value={location.id}
                        checked={formData.locationIds.includes(location.id)}
                        onChange={handleLocationChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <label htmlFor={`location-${location.id}`} className="ml-2 text-sm text-gray-700">
                        {location.displayName}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={handleCloseSidebar}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg mr-3 hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Worker'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 