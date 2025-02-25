export default function ConversationsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Conversations</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          Manage your customer conversations and support tickets.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Active Chats</h2>
            <p className="text-gray-500">View and respond to ongoing conversations</p>
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Support History</h2>
            <p className="text-gray-500">Access past conversations and resolutions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
