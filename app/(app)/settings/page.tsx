import Link from 'next/link';
import { BarChart3, Receipt, UserCog, Shield, LogOut } from 'lucide-react';
import { signOut } from "@/auth";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/settings/account" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <UserCog className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold">Account Settings</h2>
          </div>
          <p className="text-gray-500">Manage your account information and preferences</p>
        </Link>

        <Link href="/settings/security" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>
          <p className="text-gray-500">Update your security settings and permissions</p>
        </Link>

        <Link href="/settings/usage" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold">Usage Analytics</h2>
          </div>
          <p className="text-gray-500">Monitor your platform usage and resource consumption</p>
        </Link>

        <Link href="/settings/billing" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Receipt className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold">Billing & Subscription</h2>
          </div>
          <p className="text-gray-500">Manage your subscription plan and billing information</p>
        </Link>
      </div>

      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <LogOut className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold">Sign Out</h2>
          </div>
          <p className="text-gray-500 mb-4">Sign out of your account</p>
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button 
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 