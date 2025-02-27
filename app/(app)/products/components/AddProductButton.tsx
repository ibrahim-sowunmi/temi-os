"use client";

import { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AddProductButton() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

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
    description: '',
    price: '',
    currency: 'usd',
    imageUrl: '',
    categories: '',
    inStock: true,
    stockQuantity: '',
    active: true,
  });

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
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }

      // Prepare data for API
      const apiData: any = {
        name: formData.name,
        description: formData.description || null,
        active: formData.active,
        status: formData.active ? 'active' : 'inactive',
      };

      // Only include price if provided
      if (formData.price !== '') {
        apiData.price = parseInt(formData.price, 10);
        apiData.currency = formData.currency;
      }

      // Handle image
      if (formData.imageUrl) {
        apiData.images = [formData.imageUrl];
      } else {
        apiData.images = [];
      }

      // Handle categories
      if (formData.categories.trim()) {
        apiData.categories = formData.categories.split(',').map(cat => cat.trim());
      } else {
        apiData.categories = [];
      }

      // Handle inventory
      apiData.inStock = formData.inStock;
      if (formData.stockQuantity !== '') {
        apiData.stockQuantity = parseInt(formData.stockQuantity, 10);
      }

      // Send to API
      const response = await fetch('/api/stripe/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      // Success - close sidebar and refresh
      handleCloseSidebar();
      
      // Reset form data
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          price: '',
          currency: 'usd',
          imageUrl: '',
          categories: '',
          inStock: true,
          stockQuantity: '',
          active: true,
        });
      }, 300); // Reset after animation completes
      
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error('Error creating product:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only render if authenticated
  if (!session) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleOpenSidebar}
        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Add Product</span>
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
                <h2 className="text-xl font-semibold text-left">Add New Product</h2>
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

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Price */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                      Price (in cents)
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1999 for $19.99"
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currency">
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="gbp">GBP</option>
                      <option value="jpy">JPY</option>
                      <option value="cad">CAD</option>
                    </select>
                  </div>
                </div>

                {/* Image URL */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="imageUrl">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Categories */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categories">
                    Categories (comma separated)
                  </label>
                  <input
                    type="text"
                    id="categories"
                    name="categories"
                    value={formData.categories}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="electronics, gadgets, accessories"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* In Stock Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="inStock"
                      name="inStock"
                      checked={formData.inStock}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-gray-700 text-sm font-bold" htmlFor="inStock">
                      In Stock
                    </label>
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stockQuantity">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      id="stockQuantity"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      min="0"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave blank if not tracking"
                    />
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
                    Product Active
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
                    {isSubmitting ? 'Creating...' : 'Create Product'}
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