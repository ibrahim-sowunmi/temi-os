"use client";

import { useState, useEffect } from "react";
import { X, PlusCircle, Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { KnowledgeBaseScope } from "@prisma/client";

// Helper types for selectable items
interface Product {
  id: string;
  name: string;
}

interface Terminal {
  id: string;
  name: string | null;
}

interface Location {
  id: string;
  displayName: string;
}

export default function AddKnowledgeBaseButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scope, setScope] = useState<KnowledgeBaseScope>("GLOBAL");
  const [tags, setTags] = useState("");
  const [active, setActive] = useState(true);
  
  // For handling attachments based on scope
  const [productIds, setProductIds] = useState<string[]>([]);
  const [terminalIds, setTerminalIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  
  // Store fetched items
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [availableTerminals, setAvailableTerminals] = useState<Terminal[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  
  // Loading states for fetching items
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingTerminals, setLoadingTerminals] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  const [error, setError] = useState("");

  const openModal = () => {
    setIsOpen(true);
    // Fetch relevant items based on the initial scope
    if (scope === "PRODUCT") {
      fetchProducts();
    } else if (scope === "READER") {
      fetchTerminals();
    } else if (scope === "LOCATION") {
      fetchLocations();
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    // Reset form fields when closing
    setTimeout(() => {
      setTitle("");
      setContent("");
      setScope("GLOBAL");
      setTags("");
      setActive(true);
      setProductIds([]);
      setTerminalIds([]);
      setLocationIds([]);
      setError("");
    }, 300); // Wait for animation to finish
  };

  // Fetch available products for the merchant
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/stripe/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setAvailableProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch available terminal readers for the merchant
  const fetchTerminals = async () => {
    setLoadingTerminals(true);
    try {
      const response = await fetch("/api/stripe/terminal/readers");
      if (!response.ok) {
        throw new Error("Failed to fetch terminal readers");
      }
      const data = await response.json();
      setAvailableTerminals(data);
    } catch (err) {
      console.error("Error fetching terminal readers:", err);
      setError("Failed to load terminal readers");
    } finally {
      setLoadingTerminals(false);
    }
  };

  // Fetch available locations for the merchant
  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const response = await fetch("/api/stripe/terminal/locations");
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      const data = await response.json();
      setAvailableLocations(data);
    } catch (err) {
      console.error("Error fetching locations:", err);
      setError("Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  // Handle scope changes and fetch relevant items
  const handleScopeChange = (newScope: KnowledgeBaseScope) => {
    setScope(newScope);
    
    // Reset previous selections
    setProductIds([]);
    setTerminalIds([]);
    setLocationIds([]);
    
    // Fetch relevant items for the new scope
    if (newScope === "PRODUCT" && availableProducts.length === 0) {
      fetchProducts();
    } else if (newScope === "READER" && availableTerminals.length === 0) {
      fetchTerminals();
    } else if (newScope === "LOCATION" && availableLocations.length === 0) {
      fetchLocations();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError("");
    
    try {
      // Prepare the payload
      const payload = {
        title,
        content,
        scope,
        tags: tags.split(",").map(tag => tag.trim()).filter(tag => tag !== ""),
        active,
        // Only include relevant IDs based on scope
        ...(scope === "PRODUCT" && productIds.length > 0 && { productIds }),
        ...(scope === "READER" && terminalIds.length > 0 && { terminalIds }),
        ...(scope === "LOCATION" && locationIds.length > 0 && { locationIds }),
      };
      
      // Send the request to create a new knowledge base
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create knowledge base");
      }
      
      // Close the modal and refresh
      closeModal();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection of an item
  const toggleSelection = (id: string, type: 'product' | 'terminal' | 'location') => {
    if (type === 'product') {
      setProductIds(prev => 
        prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
      );
    } else if (type === 'terminal') {
      setTerminalIds(prev => 
        prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
      );
    } else if (type === 'location') {
      setLocationIds(prev => 
        prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
      );
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Knowledge Base
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
                <h2 className="text-xl font-semibold">New Knowledge Base</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    Content *
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="scope" className="block text-sm font-medium text-gray-700">
                    Scope *
                  </label>
                  <select
                    id="scope"
                    value={scope}
                    onChange={(e) => handleScopeChange(e.target.value as KnowledgeBaseScope)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="PRODUCT">Product</option>
                    <option value="READER">Terminal Reader</option>
                    <option value="LOCATION">Location</option>
                  </select>
                </div>
                
                {/* Additional fields based on scope */}
                {scope === "PRODUCT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Products
                    </label>
                    <div className="mt-1 border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                      {loadingProducts ? (
                        <div className="flex justify-center items-center p-4">
                          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : availableProducts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No products found
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {availableProducts.map((product) => (
                            <div 
                              key={product.id}
                              onClick={() => toggleSelection(product.id, 'product')}
                              className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                                productIds.includes(product.id) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <span className="text-sm">{product.name}</span>
                              {productIds.includes(product.id) && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {productIds.length} product(s) selected
                    </div>
                  </div>
                )}
                
                {scope === "READER" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Terminal Readers
                    </label>
                    <div className="mt-1 border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                      {loadingTerminals ? (
                        <div className="flex justify-center items-center p-4">
                          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : availableTerminals.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No terminal readers found
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {availableTerminals.map((terminal) => (
                            <div 
                              key={terminal.id}
                              onClick={() => toggleSelection(terminal.id, 'terminal')}
                              className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                                terminalIds.includes(terminal.id) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <span className="text-sm">{terminal.name || "Unnamed Reader"}</span>
                              {terminalIds.includes(terminal.id) && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {terminalIds.length} terminal reader(s) selected
                    </div>
                  </div>
                )}
                
                {scope === "LOCATION" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Locations
                    </label>
                    <div className="mt-1 border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                      {loadingLocations ? (
                        <div className="flex justify-center items-center p-4">
                          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : availableLocations.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No locations found
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {availableLocations.map((location) => (
                            <div 
                              key={location.id}
                              onClick={() => toggleSelection(location.id, 'location')}
                              className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                                locationIds.includes(location.id) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <span className="text-sm">{location.displayName}</span>
                              {locationIds.includes(location.id) && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {locationIds.length} location(s) selected
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : "Create Knowledge Base"}
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