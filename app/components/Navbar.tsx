'use client';

import Link from 'next/link';
import { Search, HelpCircle, Bell, Settings } from 'lucide-react';
import { useSidebar } from './layout/SidebarContext';

export default function Navbar() {
  const { isCollapsed } = useSidebar();

  return (
    <nav className={`border-b border-foreground/10 bg-background transition-all duration-300 ${isCollapsed ? 'pl-20' : 'pl-64'}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-1 flex items-center justify-start">
            <div className="flex-shrink-0">
              <Link 
                href="/"
                className="text-xl font-bold hover:opacity-80 transition-opacity"
              >
                Temi OS
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-2 border border-foreground/10 rounded-md leading-5 bg-background placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <button
              className="p-2 rounded-md hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            <button
              className="p-2 rounded-md hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            <Link
              href="/settings"
              className="p-2 rounded-md hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 