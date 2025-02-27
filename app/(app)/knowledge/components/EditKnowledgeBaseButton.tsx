"use client";

import { useState, useEffect } from "react";
import { X, Edit, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { KnowledgeBaseScope } from "@prisma/client";

interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  scope: KnowledgeBaseScope;
  tags: string[];
  active: boolean;
  products: { id: string; name: string }[];
  terminals: { id: string; name: string | null }[];
  locations: { id: string; displayName: string }[];
}

interface EditKnowledgeBaseButtonProps {
  knowledgeBase: KnowledgeBase;
}

export default function EditKnowledgeBaseButton({ knowledgeBase }: EditKnowledgeBaseButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(knowledgeBase.title);
  const [content, setContent] = useState(knowledgeBase.content);
  const [tags, setTags] = useState(knowledgeBase.tags.join(", "));
  const [active, setActive] = useState(knowledgeBase.active);
  
  // For handling attachments based on scope
  const [productIds, setProductIds] = useState<string[]>(knowledgeBase.products.map(p => p.id));
  const [terminalIds, setTerminalIds] = useState<string[]>(knowledgeBase.terminals.map(t => t.id));
  const [locationIds, setLocationIds] = useState<string[]>(knowledgeBase.locations.map(l => l.id));
  
  // Store all available items
  const [availableProducts, setAvailableProducts] = useState<{ id: string; name: string }[]>([]);
  const [availableTerminals, setAvailableTerminals] = useState<{ id: string; name: string | null }[]>([]);
  const [availableLocations, setAvailableLocations] = useState<{ id: string; displayName: string }[]>([]);
  
  // Loading states for fetching items
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingTerminals, setLoadingTerminals] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  const [error, setError] = useState("");

  // Reset the form when knowledgeBase changes
  useEffect(() => {
    setTitle(knowledgeBase.title);
    setContent(knowledgeBase.content);
    setTags(knowledgeBase.tags.join(", "));
    setActive(knowledgeBase.active);
    setProductIds(knowledgeBase.products.map(p => p.id));
    setTerminalIds(knowledgeBase.terminals.map(t => t.id));
    setLocationIds(knowledgeBase.locations.map(l => l.id));
  }, [knowledgeBase]);

  const openModal = () => {
    setIsOpen(true);
    // Fetch relevant items based on the scope if not already loaded
    if (knowledgeBase.scope === "PRODUCT" && availableProducts.length === 0) {
      fetchProducts();
    } else if (knowledgeBase.scope === "READER" && availableTerminals.length === 0) {
      fetchTerminals();
    } else if (knowledgeBase.scope === "LOCATION" && availableLocations.length === 0) {
      fetchLocations();
    }
  };
  
  const closeModal = () => {
    setIsOpen(false);
    // Reset form to initial state when closing without saving
    setTimeout(() => {
      setTitle(knowledgeBase.title);
      setContent(knowledgeBase.content);
      setTags(knowledgeBase.tags.join(", "));
      setActive(knowledgeBase.active);
      setProductIds(knowledgeBase.products.map(p => p.id));
      setTerminalIds(knowledgeBase.terminals.map(t => t.id));
      setLocationIds(knowledgeBase.locations.map(l => l.id));
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
        tags: tags.split(",").map(tag => tag.trim()).filter(tag => tag !== ""),
        active,
        // Only include relevant IDs based on scope
        ...(knowledgeBase.scope === "PRODUCT" && { productIds }),
        ...(knowledgeBase.scope === "READER" && { terminalIds }),
        ...(knowledgeBase.scope === "LOCATION" && { locationIds }),
      };
      
      // Send the request to update the knowledge base
      const response = await fetch(`/api/knowledge?id=${knowledgeBase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update knowledge base");
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

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        <Edit className="mr-2 h-4 w-4" />
        Edit
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
                <h2 className="text-xl font-semibold">Edit Knowledge Base</h2>
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
                    Scope
                  </label>
                  <div className="mt-1 py-2 px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
                    {knowledgeBase.scope === "GLOBAL" && "Global"}
                    {knowledgeBase.scope === "PRODUCT" && "Product"}
                    {knowledgeBase.scope === "READER" && "Terminal Reader"}
                    {knowledgeBase.scope === "LOCATION" && "Location"}
                    <div className="text-xs mt-1 text-gray-500">
                      Scope cannot be changed after creation
                    </div>
                  </div>
                </div>
                
                {/* Attachments selection based on scope */}
                {knowledgeBase.scope === "PRODUCT" && (
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
                
                {knowledgeBase.scope === "READER" && (
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
                
                {knowledgeBase.scope === "LOCATION" && (
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
                        Saving...
                      </>
                    ) : "Save Changes"}
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