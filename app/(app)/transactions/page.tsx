export default function TransactionsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          View and manage your transaction history.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Recent Transactions</h2>
            <p className="text-gray-500">View your latest transaction activity</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Transaction Reports</h2>
            <p className="text-gray-500">Generate detailed transaction reports</p>
          </div>
        </div>
      </div>
    </div>
  );
} 