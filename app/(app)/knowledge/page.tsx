export default function KnowledgePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Knowledge Base</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          Access helpful resources, guides, and documentation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Documentation</h2>
            <p className="text-gray-500">Browse through our comprehensive guides</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">FAQs</h2>
            <p className="text-gray-500">Find answers to common questions</p>
          </div>
        </div>
      </div>
    </div>
  );
} 