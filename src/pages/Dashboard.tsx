import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge.js';
import { MatchScorePill } from '../components/MatchScorePill.js';
import { CardSkeleton } from '../components/Skeleton.js';
import { useAppStore } from '../store/index.js';
import {
  Briefcase,
  CheckCircle2,
  Send,
  AlertTriangle,
  FileText,
  Play,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { addToast, activeUserId } = useAppStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', activeUserId],
    queryFn: () => api.getDashboardStats(),
    refetchInterval: 8000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user', activeUserId],
    queryFn: () => api.getCurrentUser(),
    staleTime: 30000,
  });
  const firstName = (currentUser?.data.full_name || '').split(' ')[0];

  const { data: statusData } = useQuery({
    queryKey: ['automation-status', activeUserId],
    queryFn: () => api.getAutomationStatus(),
    refetchInterval: 5000,
  });

  const runNowMutation = useMutation({
    mutationFn: () => api.runNow(),
    onSuccess: (res) => {
      addToast({
        type: 'success',
        title: 'Run Started',
        message: res.message || 'Automation batch triggered.',
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['automation-status'] });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Run Failed',
        message: err.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="card p-8 text-center text-rose-600">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
        <h3 className="font-semibold text-base">Failed loading dashboard metrics</h3>
        <p className="text-xs text-slate-500 mt-1">{(error as any)?.message || 'Server communication issue'}</p>
      </div>
    );
  }

  const stats = data.data;
  const isRunning = statusData?.data?.isRunning;

  const metricCards = [
    {
      label: 'Jobs Found',
      value: stats.jobs_found,
      icon: Briefcase,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      link: '/jobs',
    },
    {
      label: 'Matched',
      value: stats.matched,
      icon: CheckCircle2,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
      link: '/jobs',
    },
    {
      label: 'Applied',
      value: stats.applied,
      icon: Send,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      link: '/applications',
    },
    {
      label: 'Needs Attention',
      value: stats.needs_attention,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      link: '/applications?status=REQUIRES_HUMAN_ACTION',
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      link: '/applications?status=FAILED',
    },
    {
      label: 'Resumes Generated',
      value: stats.resumes_generated,
      icon: FileText,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      link: '/resumes',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner & Automation Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 to-slate-850 text-white rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono tracking-wider text-brand-400 uppercase font-semibold">
              Live System State
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400">
              Mode: <strong className="text-white uppercase">{stats.automation_mode}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {firstName ? `Good day, ${firstName}` : 'Good day'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            {isRunning
              ? 'Automation worker is currently scanning, tailoring resumes, and verifying applications in real time.'
              : 'Deterministic background workers are standing by ready to discover and process matching job applications.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/automation"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Cpu className="w-4 h-4 text-brand-400" />
            Command Center
          </Link>
          <button
            onClick={() => runNowMutation.mutate()}
            disabled={runNowMutation.isPending || isRunning}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {runNowMutation.isPending ? 'Launching...' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className="card p-4 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</div>
            </Link>
          );
        })}
      </div>

      {/* Grid: Recent Jobs & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Discovered Jobs */}
        <div className="card flex flex-col">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Discovered Jobs</h2>
            </div>
            <Link
              to="/jobs"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {stats.recent_jobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No jobs discovered yet. Click Scan to search for matching positions.
              </div>
            ) : (
              stats.recent_jobs.map((job) => (
                <div key={job.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-brand-600 truncate block"
                    >
                      {job.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>{job.company}</span>
                      <span>&bull;</span>
                      <span>{job.locations.join(', ') || job.work_mode}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-[11px] text-slate-600">{job.platform}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {job.match && <MatchScorePill score={job.match.overall_match_score} size="sm" />}
                    <Link
                      to={`/jobs/${job.id}`}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications Activity */}
        <div className="card flex flex-col">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Applications</h2>
            </div>
            <Link
              to="/applications"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {stats.recent_applications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No applications processed yet. Automation will process matching jobs automatically.
              </div>
            ) : (
              stats.recent_applications.map((app) => (
                <div key={app.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/applications/${app.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-brand-600 truncate block"
                    >
                      {app.job?.title || 'Software Engineering Role'}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>{app.job?.company || 'Verified Employer'}</span>
                      <span>&bull;</span>
                      <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={app.status} size="sm" />
                    {app.job?.application_url && (
                      <a
                        href={app.job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-xs font-medium bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200/70 rounded-md transition-colors inline-flex items-center gap-1"
                        title="Open applied job posting"
                      >
                        <ExternalLink className="w-3 h-3 text-brand-600" />
                        <span>Job Link</span>
                      </a>
                    )}
                    <Link
                      to={`/applications/${app.id}`}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
