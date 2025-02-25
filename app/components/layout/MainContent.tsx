'use client';

import React from 'react';
import { useSidebar } from './SidebarContext';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main 
      className={`flex-1 transition-all duration-300 p-8 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}
    >
      {children}
    </main>
  );
} 