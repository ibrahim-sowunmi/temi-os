export default function PayoutsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Payouts</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          Manage and track your payouts and settlements.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Payout History</h2>
            <p className="text-gray-500">View your past and scheduled payouts</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Settlement Settings</h2>
            <p className="text-gray-500">Configure your payout preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
} 