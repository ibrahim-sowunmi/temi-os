"use client";

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductMoreOptionsMenuProps {
  productId: string;
  productName: string;
}

export default function ProductMoreOptionsMenu({ productId, productName }: ProductMoreOptionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Close the menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteProduct = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/stripe/products?productId=${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      // Redirect to products list on success
      router.push('/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      setIsDeleting(false);
    }
  };

  const handleOpenMenu = () => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 150 + window.scrollX, // 150 is slightly less than menu width
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={handleOpenMenu}
        className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
        aria-label="More options"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div 
          className="fixed w-48 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200"
          style={{ 
            top: `${menuPosition.top}px`, 
            left: `${menuPosition.left}px` 
          }}
        >
          <button
            onClick={() => {
              setIsMenuOpen(false);
              setIsDeleteModalOpen(true);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete product
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Delete product</h3>
              <p className="mb-4 text-gray-600">
                Are you sure you want to delete <span className="font-semibold">{productName}</span>? This action cannot be undone.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 