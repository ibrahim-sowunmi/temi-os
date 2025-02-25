export default function BillingPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Billing & Subscription</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          Manage your subscription plan and billing information.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
            <p className="text-gray-500">View and manage your subscription details</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Payment History</h2>
            <p className="text-gray-500">Access your billing history and invoices</p>
          </div>
        </div>
      </div>
    </div>
  );
} 