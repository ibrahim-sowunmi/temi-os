"use client";

import { useState, useEffect } from 'react';
import { PencilIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditLocationButtonProps {
  location: {
    id: string;
    displayName: string;
    address: any;
    active: boolean;
  };
}

export default function EditLocationButton({ location }: EditLocationButtonProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  
  // Form state based on location data
  const [formData, setFormData] = useState({
    displayName: location.displayName || '',
    line1: location.address?.line1 || '',
    city: location.address?.city || '',
    state: location.address?.state || '',
    country: location.address?.country || 'US',
    postalCode: location.address?.postalCode || '',
    active: location.active,
  });

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
    // Reset form data to current location values
    setFormData({
      displayName: location.displayName || '',
      line1: location.address?.line1 || '',
      city: location.address?.city || '',
      state: location.address?.state || '',
      country: location.address?.country || 'US',
      postalCode: location.address?.postalCode || '',
      active: location.active,
    });
    
    setIsAnimating(true);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsAnimating(true);
    setIsSidebarOpen(false);
  };

  const handleAnimationEnd = () => {
    setIsAnimating(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Validate required fields
      if (!formData.displayName.trim()) {
        throw new Error('Location name is required');
      }
      
      if (!formData.line1.trim() || !formData.city.trim() || 
          !formData.state.trim() || !formData.postalCode.trim()) {
        throw new Error('Complete address is required');
      }

      // Prepare data for API
      const apiData = {
        displayName: formData.displayName,
        address: {
          line1: formData.line1,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode
        },
        active: formData.active
      };

      // Send to API
      const response = await fetch(`/api/stripe/terminal/locations?locationId=${location.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update location');
      }

      // Success - close sidebar and refresh
      handleCloseSidebar();
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error('Error updating location:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to update location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenSidebar}
        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <PencilIcon className="w-4 h-4" />
        <span>Edit Location</span>
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
                <h2 className="text-xl font-semibold text-left">Edit Location</h2>
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

                {/* Display Name */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="displayName">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Address Line 1 */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="line1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="line1"
                    name="line1"
                    value={formData.line1}
                    onChange={handleInputChange}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* City and State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="state">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Postal Code and Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postalCode">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
                      Country *
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                    </select>
                  </div>
                </div>

                {/* Active Status */}
                <div className="mb-6 flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={formData.active}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-gray-700 text-sm font-bold" htmlFor="active">
                    Location Active
                  </label>
                </div>

                <div className="flex justify-end space-x-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={handleCloseSidebar}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
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