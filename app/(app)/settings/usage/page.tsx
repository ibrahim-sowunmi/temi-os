export default function UsagePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Usage Analytics</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          Monitor your platform usage and resource consumption.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Resource Usage</h2>
            <p className="text-gray-500">Track API calls, storage, and bandwidth usage</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Usage Reports</h2>
            <p className="text-gray-500">Download detailed usage reports and analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
} 