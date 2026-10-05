import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { CardSkeleton } from '../components/Skeleton.js';
import { useAppStore } from '../store/index.js';
import { Save, Shield, Sliders, Trash2, Globe, Layers, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toList, fromList } from '../components/ProfileEditors.js';
import { UserPreferences } from '../types/index.js';



export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast, activeUserId } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ['settings', activeUserId],
    queryFn: () => api.getSettings(),
  });

  const [form, setForm] = useState<Partial<UserPreferences>>({});

  useEffect(() => {
    if (data?.data) {
      setForm({
        ...data.data,
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<UserPreferences>) => api.updateSettings(updates),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Saved', message: 'Preferences & platform selection updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['settings', activeUserId] });
      queryClient.invalidateQueries({ queryKey: ['automation-status'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Update Failed', message: err.message });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: () => api.clearData(true),
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Dummy Data Cleared',
        message: 'All test applications, automation runs, and temporary records have been cleared.',
      });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['resume-versions'] });
      queryClient.invalidateQueries({ queryKey: ['automation-runs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Clear Failed', message: err.message });
    },
  });

  if (isLoading || !form.id) return <CardSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Automation Settings & Eligibility</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure target application platforms, matching thresholds, daily quotas, and worker behavior.
          </p>
        </div>

        <button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
          className="btn-primary py-2 px-4 text-xs flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{updateMutation.isPending ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Platforms live on their own page */}
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-brand-200/90">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-brand-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Platforms & logins</h2>
              <p className="text-[11px] text-slate-500">
                {(form.enabled_platforms || []).length
                  ? `Applying on: ${(form.enabled_platforms || []).join(', ')}`
                  : 'No platform selected yet.'}
              </p>
            </div>
          </div>
          <Link to="/platforms" className="btn-secondary py-1.5 px-3 text-xs self-start sm:self-auto">
            <Layers className="w-3.5 h-3.5" /> Manage platforms
          </Link>
        </div>

        {/* Job search */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Search className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-slate-900">Job Search</h2>
          </div>
          <p className="text-[11px] text-slate-500 -mt-2">
            Leave keywords or locations empty to use your preferred roles and locations (below and on your profile).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Search keywords (comma-separated)</label>
              <input
                type="text"
                value={fromList(form.search_keywords)}
                onChange={(e) => setForm({ ...form, search_keywords: toList(e.target.value) })}
                className="input-text"
                placeholder="e.g. React Developer, Frontend Engineer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Search locations (comma-separated)</label>
              <input
                type="text"
                value={fromList(form.search_locations)}
                onChange={(e) => setForm({ ...form, search_locations: toList(e.target.value) })}
                className="input-text"
                placeholder="e.g. Bengaluru, Pune, Remote"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Posted within (days)</label>
              <input type="number" min="1" max="60" value={form.posted_within_days || 7}
                onChange={(e) => setForm({ ...form, posted_within_days: parseInt(e.target.value, 10) || 7 })} className="input-text" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jobs to check per platform per run</label>
              <input type="number" min="1" max="50" value={form.jobs_per_platform || 15}
                onChange={(e) => setForm({ ...form, jobs_per_platform: parseInt(e.target.value, 10) || 15 })} className="input-text" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max applications per platform per day</label>
              <input type="number" min="1" max="100" value={form.per_platform_daily_limit || 15}
                onChange={(e) => setForm({ ...form, per_platform_daily_limit: parseInt(e.target.value, 10) || 15 })} className="input-text" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 mt-0.5 accent-brand-600" checked={Boolean(form.show_browser)}
                onChange={(e) => setForm({ ...form, show_browser: e.target.checked })} />
              <span><strong>Show the browser window while applying.</strong> Useful to watch the bot; Naukri and Indeed always use a (minimized) window.</span>
            </label>
            <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 mt-0.5 accent-brand-600" checked={form.naukri_upload_tailored_resume !== false}
                onChange={(e) => setForm({ ...form, naukri_upload_tailored_resume: e.target.checked })} />
              <span><strong>Naukri: upload the tailored resume before each application.</strong> Naukri applies with your profile resume, so it is replaced with the job-specific one.</span>
            </label>
          </div>
        </div>

        {/* Core Automation Thresholds */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-slate-900">Thresholds & Limits</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Profile Match Score ({form.minimum_match_score}%)
              </label>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={form.minimum_match_score || 70}
                onChange={(e) =>
                  setForm({ ...form, minimum_match_score: parseInt(e.target.value, 10) })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Jobs scoring below this threshold are automatically skipped.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Applications Per Day
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.max_applications_per_day || 25}
                onChange={(e) =>
                  setForm({ ...form, max_applications_per_day: parseInt(e.target.value, 10) || 10 })
                }
                className="input-text"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Daily submission limit to avoid spamming platforms.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduler Interval (Minutes)
              </label>
              <input
                type="number"
                min="10"
                max="1440"
                step="10"
                value={form.schedule_interval_mins || 60}
                onChange={(e) =>
                  setForm({ ...form, schedule_interval_mins: parseInt(e.target.value, 10) || 60 })
                }
                className="input-text"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Frequency for background job discovery and queue runs.
              </span>
            </div>
          </div>
        </div>

        {/* Exclusion Rules */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-slate-900">Exclusion Rules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Excluded Companies (comma-separated)
              </label>
              <input
                type="text"
                value={fromList(form.excluded_companies)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    excluded_companies: toList(e.target.value),
                  })
                }
                className="input-text"
                placeholder="e.g. CryptoScam LLC, BadCorp"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Never apply to jobs posted by these companies.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Excluded Keywords in JD (comma-separated)
              </label>
              <input
                type="text"
                value={fromList(form.excluded_keywords)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    excluded_keywords: toList(e.target.value),
                  })
                }
                className="input-text"
                placeholder="e.g. unpaid, commission only, gambling"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Skip jobs whose descriptions mention any of these keywords.
              </span>
            </div>
          </div>
        </div>

        {/* Preferred Roles & Locations */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Target Roles & Geography
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Job Titles (comma-separated)
              </label>
              <input
                type="text"
                value={fromList(form.preferred_roles)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    preferred_roles: toList(e.target.value),
                  })
                }
                className="input-text"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Locations (comma-separated)
              </label>
              <input
                type="text"
                value={fromList(form.preferred_locations)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    preferred_locations: toList(e.target.value),
                  })
                }
                className="input-text"
              />
            </div>
          </div>
        </div>

        {/* Data Management & Clean Slate */}
        <div className="card p-6 border-slate-200/90 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-semibold text-slate-900">Data Management & Clean Slate</h2>
          </div>
          <p className="text-xs text-slate-500">
            Clear your application history, automation runs and generated resumes. Your profile, logins and screening answers are kept.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (window.confirm('Clear all your applications, automation runs and generated resumes? This cannot be undone.')) {
                  clearDataMutation.mutate();
                }
              }}
              disabled={clearDataMutation.isPending}
              className="btn-secondary py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearDataMutation.isPending ? 'Clearing...' : 'Clear application history'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
