'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, X } from 'lucide-react';

interface Location {
  id: string;
  displayName: string;
}

interface RegisterTerminalButtonProps {
  merchantId: string;
}

export default function RegisterTerminalButton({ merchantId }: RegisterTerminalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [registrationCode, setRegistrationCode] = useState('');
  const [label, setLabel] = useState('');
  const [locationId, setLocationId] = useState('');

  // Fetch locations when the modal opens
  const openModal = async () => {
    setIsOpen(true);
    await fetchLocations();
  };

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/terminal/locations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registrationCode || !locationId) {
      setError('Registration code and location are required.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/stripe/terminal/readers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationCode,
          label,
          locationId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register terminal');
      }
      
      const terminal = await response.json();
      
      // Close modal and redirect to the new terminal's detail page
      setIsOpen(false);
      router.push(`/terminals/readers/${terminal.id}`);
      router.refresh(); // Refresh the page data
    } catch (err: any) {
      console.error('Error registering terminal:', err);
      setError(err.message || 'Failed to register terminal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Button to open modal */}
      <button
        onClick={openModal}
        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
      >
        <PlusCircle size={18} />
        <span>Register Terminal</span>
      </button>
      
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Register New Terminal</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="registrationCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="registrationCode"
                  type="text"
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value)}
                  placeholder="e.g. snazzy-cheetah-vista"
                  className="w-full p-2 border rounded-md"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can find this code on your terminal device
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  id="label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Store Front Counter"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <select
                  id="locationId"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.displayName}
                    </option>
                  ))}
                </select>
                {locations.length === 0 && !isLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    No locations found. Please create a location first.
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isLoading ? 'Registering...' : 'Register Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 