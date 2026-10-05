import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/index.js';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  UserCheck,
  Send,
  Cpu,
  BarChart3,
  Settings,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen, activeUserId } = useAppStore();
  const { data: currentUser } = useQuery({
    queryKey: ['current-user', activeUserId],
    queryFn: () => api.getCurrentUser(),
    staleTime: 30000,
  });
  const fullName = currentUser?.data.full_name || 'Candidate';
  const email = currentUser?.data.email || '';
  const initials = fullName
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/applications', label: 'Applications', icon: Send },
    { to: '/resumes', label: 'Resumes', icon: FileText },
    { to: '/platforms', label: 'Platforms & Logins', icon: Globe },
    { to: '/automation', label: 'Automation', icon: Cpu },
    { to: '/automation/logs', label: 'Automation Logs', icon: ScrollText },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/profile', label: 'Candidate Profile', icon: UserCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out border-r border-slate-800 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden font-bold text-white tracking-tight"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shrink-0 shadow-inner shadow-black/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-semibold leading-none text-white">AutoApply</span>
                <span className="text-[10px] text-brand-400 font-mono tracking-wider uppercase mt-1">
                  AI Automation
                </span>
              </div>
            )}
          </NavLink>

          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/50'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Badge at bottom */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title={`Candidate Profile: ${fullName}`}
          >
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-brand-400 shrink-0">
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-200 truncate">{fullName}</span>
                <span className="text-xs text-slate-500 truncate">{email}</span>
              </div>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
};
