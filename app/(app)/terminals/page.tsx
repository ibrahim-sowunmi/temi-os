export default function TerminalsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Terminals</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          Manage and monitor your payment terminals.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Active Terminals</h2>
            <p className="text-gray-500">View and manage connected terminals</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Terminal Settings</h2>
            <p className="text-gray-500">Configure terminal preferences and options</p>
          </div>
        </div>
      </div>
    </div>
  );
} 