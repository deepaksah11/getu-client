import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useAppStore } from '../store/index.js';
import {
  Search,
  Menu,
  Play,
  Bell,
  CheckCircle,
  ExternalLink,
  User,
  ChevronDown,
  UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { searchQuery, setSearchQuery, setMobileNavOpen, addToast, activeUserId, openUserModal } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: userData } = useQuery({
    queryKey: ['current-user', activeUserId],
    queryFn: () => api.getCurrentUser(),
  });

  const { data: statusData } = useQuery({
    queryKey: ['automation-status'],
    queryFn: () => api.getAutomationStatus(),
    refetchInterval: 5000,
  });

  const runNowMutation = useMutation({
    mutationFn: () => api.runNow(),
    onSuccess: (res) => {
      addToast({
        type: 'success',
        title: 'Automation Triggered',
        message: res.message || 'Automation batch launched successfully in background.',
      });
      queryClient.invalidateQueries({ queryKey: ['automation-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['automation-steps'] });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Run Failed',
        message: err.message || 'Could not launch automation batch.',
      });
    },
  });

  const automationStatus = statusData?.data?.isRunning
    ? 'RUNNING'
    : statusData?.data?.enabled
    ? 'IDLE'
    : 'PAUSED';

  const mode = statusData?.data?.mode || 'dry-run';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search jobs, skills, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate('/jobs');
            }}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Automation Status Badge */}
        <div
          onClick={() => navigate('/automation')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-colors bg-white hover:bg-slate-50 border-slate-200"
          title={`Automation Mode: ${mode.toUpperCase()} (Click to manage)`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              automationStatus === 'RUNNING'
                ? 'bg-emerald-500 animate-ping'
                : automationStatus === 'IDLE'
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`}
          />
          <span className="text-slate-700 font-semibold">{automationStatus}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 uppercase font-mono text-[10px] tracking-wider">{mode}</span>
        </div>

        {/* Quick Action: Run Now */}
        <button
          onClick={() => runNowMutation.mutate()}
          disabled={runNowMutation.isPending || statusData?.data?.isRunning}
          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-sm"
          title="Trigger immediate discovery and application batch"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{runNowMutation.isPending ? 'Starting...' : 'Run Now'}</span>
        </button>

        {/* Candidate Profile Switcher & Add User Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openUserModal('list')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs group"
            title="Switch active candidate profile"
          >
            <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {userData?.data?.full_name ? userData.data.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block max-w-[130px]">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {userData?.data?.full_name || 'Candidate Profile'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {userData?.data?.email || 'Switch profile'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
          </button>

          <button
            onClick={() => openUserModal('create')}
            className="p-1.5 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors shadow-2xs flex items-center gap-1 text-xs font-semibold"
            title="Add new candidate user profile"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden xl:inline">New Candidate</span>
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[10px] text-brand-600 font-medium">Live Activity</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-950">System Ready</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Platform adapters initialized. Playwright worker active.
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-950">Mock Test Portal Live</p>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Controlled test jobs ready for deterministic verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
