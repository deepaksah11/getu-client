import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Navbar } from './Navbar.js';
import { ToastContainer } from './ToastContainer.js';
import { UserSwitcherModal } from './UserSwitcherModal.js';
import { useAppStore } from '../store/index.js';

export const Layout: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Candidate Profile Switcher & New User Modal */}
      <UserSwitcherModal />

      {/* Toast Alerts Container */}
      <ToastContainer />
    </div>
  );
};
