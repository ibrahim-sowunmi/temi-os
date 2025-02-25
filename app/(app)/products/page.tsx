export default function ProductsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          Manage your product inventory, categories, and pricing here.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Product Catalog</h2>
            <p className="text-gray-500">View and manage your product listings</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Categories</h2>
            <p className="text-gray-500">Organize products into categories</p>
          </div>
        </div>
      </div>
    </div>
  );
} 