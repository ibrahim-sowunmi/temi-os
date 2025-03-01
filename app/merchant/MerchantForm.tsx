'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { User } from 'next-auth';

interface MerchantFormProps {
  user: User
}

const MerchantForm = ({ user }: MerchantFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    taxId: '',
    phoneNumber: '',
    address: '',
    imageUrl: '',
    country: ''
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      imageUrl: url
    }));
    
    // If a URL is entered, use it as the preview
    setImagePreview(url || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a FormData object for submission
      const formDataToSend = new FormData();
      
      // Add all fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, value);
        }
      });

      // Make your API call using FormData
      const response = await fetch('/api/merchant/onboard', {
        method: 'POST',
        // Don't set Content-Type header - the browser will set it with the correct boundary for FormData
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        console.log('Error response:', error);
        throw new Error(error.error || 'Failed to submit merchant information');
      }

      // Handle successful submission
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting merchant information:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit merchant information. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Name */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              required
              value={formData.businessName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Business Type */}
          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
              Business Type
            </label>
            <select
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a business type</option>
              <option value="sole_proprietorship">Sole Proprietorship</option>
              <option value="partnership">Partnership</option>
              <option value="corporation">Corporation</option>
              <option value="llc">LLC</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Tax ID */}
          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
              Tax ID
            </label>
            <input
              type="text"
              id="taxId"
              name="taxId"
              value={formData.taxId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <input
              type="text"
              id="country"
              name="country"
              required
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Business Logo URL
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                placeholder="https://example.com/logo.png"
                value={formData.imageUrl || ''}
                onChange={handleImageUrlChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {imagePreview && (
                <div className="relative w-16 h-16">
                  <Image
                    src={imagePreview}
                    alt="Business Logo Preview"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default MerchantForm; 