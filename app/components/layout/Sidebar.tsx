'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Terminal,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { useSidebar } from './SidebarContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Terminals', href: '/terminals', icon: Terminal },
  { name: 'Knowledge', href: '/knowledge', icon: BookOpen },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <div 
      className={`flex h-screen flex-col fixed left-0 top-0 bg-gray-900 text-white transition-all duration-300 z-50 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className={`flex h-16 items-center overflow-hidden ${isCollapsed ? 'justify-center' : 'px-6'}`}>
        {!isCollapsed && <h1 className="text-xl font-bold whitespace-nowrap">Temi OS</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg hover:bg-gray-800 transition-colors ${
            isCollapsed ? 'mx-auto' : 'ml-auto'
          }`}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-hidden">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-3 text-sm rounded-lg hover:bg-gray-800 transition-colors overflow-hidden ${
                isActive ? 'bg-gray-800 text-white' : 'text-gray-300'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon size={20} className="min-w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3 whitespace-nowrap truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 