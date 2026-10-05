import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useAppStore } from '../store/index.js';
import {
  X,
  UserPlus,
  CheckCircle2,
  Users,
  Briefcase,
  Mail,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserSwitcherModal: React.FC = () => {
  const { userModalOpen, setUserModalOpen, userModalMode, activeUserId, setActiveUserId, addToast } =
    useAppStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'create' | 'list'>(userModalMode || 'create');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Sync tab with store mode whenever modal opens
  useEffect(() => {
    if (userModalOpen) {
      setActiveTab(userModalMode || 'create');
    }
  }, [userModalOpen, userModalMode]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.getUsers(),
    enabled: userModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: { email: string; full_name: string }) => api.createUser(data),
    onSuccess: (res) => {
      addToast({
        type: 'success',
        title: 'Profile Created',
        message: `Candidate profile for "${res.data.profile.full_name}" is now active!`,
      });
      // Switch active user ID
      setActiveUserId(res.data.user.id);

      // Invalidate all related caches to load the new candidate
      queryClient.invalidateQueries();

      // Reset form
      setFullName('');
      setEmail('');
      setUserModalOpen(false);

      // Navigate to profile page for easy editing / resume upload
      navigate('/profile');
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Unable to create candidate profile.',
      });
    },
  });

  if (!userModalOpen) return null;

  const users = usersData?.data || [];

  const handleSwitchUser = (userId: string, name: string) => {
    if (userId === activeUserId) {
      setUserModalOpen(false);
      return;
    }
    setActiveUserId(userId);
    queryClient.invalidateQueries();
    addToast({
      type: 'info',
      title: 'Active Candidate Switched',
      message: `Now managing profile: ${name}`,
    });
    setUserModalOpen(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      addToast({ type: 'error', message: 'Please provide a valid email address.' });
      return;
    }
    if (!fullName.trim()) {
      addToast({ type: 'error', message: 'Please provide candidate full name.' });
      return;
    }
    createMutation.mutate({ email: email.trim(), full_name: fullName.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Candidate Profiles & Accounts</h3>
              <p className="text-[11px] text-slate-500">Create a new candidate or switch active profile</p>
            </div>
          </div>
          <button
            onClick={() => setUserModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'create'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Create New Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'list'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Switch Existing ({users.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'create' ? (
            /* CREATE NEW CANDIDATE PROFILE FORM */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-brand-50/60 border border-brand-200/80 text-xs text-brand-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <p>
                  Each candidate receives an isolated ground-truth profile, custom master resume, targeting preferences, and application tracking history.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Candidate Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Jordan Lee or Sarah Connor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-text text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan.lee@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-text text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Used for application submission contact fields, resume headers, and recruiter communications.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="btn-secondary py-2 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{createMutation.isPending ? 'Creating Profile...' : 'Create & Activate Profile'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* SWITCH EXISTING CANDIDATE LIST */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Registered Profiles ({users.length})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Create Another</span>
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                  <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {users.map((u) => {
                    const isActive = u.id === activeUserId;
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSwitchUser(u.id, u.full_name)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-brand-50/70 border-brand-300 ring-2 ring-brand-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 uppercase ${
                              isActive
                                ? 'bg-brand-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {u.full_name.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {u.full_name}
                              </span>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Active Profile
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mt-0.5">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 shrink-0" />
                                {u.email}
                              </span>
                              <span>&bull;</span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Briefcase className="w-3 h-3 shrink-0" />
                                {u.skills_count} skills
                              </span>
                            </div>
                          </div>
                        </div>

                        {!isActive && (
                          <button
                            type="button"
                            className="text-xs text-brand-600 hover:text-brand-800 font-semibold px-2 py-1 rounded hover:bg-brand-50 flex items-center gap-1 transition-colors shrink-0"
                          >
                            <span>Select</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
          <span>Active Profile ID: {activeUserId.slice(0, 8)}...</span>
          <button
            onClick={() => setUserModalOpen(false)}
            className="btn-secondary py-1 px-3 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
