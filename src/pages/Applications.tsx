import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge.js';
import { MatchScorePill } from '../components/MatchScorePill.js';
import { TableSkeleton } from '../components/Skeleton.js';
import {
  Send,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ApplicationStatus } from '../types/index.js';
import { useAppStore } from '../store/index.js';

export const Applications: React.FC = () => {
  const { activeUserId } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['applications', activeUserId, currentStatus],
    queryFn: () => api.getApplications(currentStatus || undefined),
    refetchInterval: 6000,
  });

  const filterTabs = [
    { label: 'All Applications', value: '' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'In Progress', value: 'APPLICATION_READY' },
    { label: 'Needs Attention', value: 'REQUIRES_HUMAN_ACTION' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Not Eligible', value: 'NOT_ELIGIBLE' },
  ];

  const applications = data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Application Tracker</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time tracking of automated submissions, workflow stages, and human action alerts.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        {filterTabs.map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.value) setSearchParams({ status: tab.value });
                else setSearchParams({});
              }}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Applications Table Card */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">
            Failed loading applications: {(error as any).message}
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No applications in this view</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {currentStatus
                ? `No applications with status "${currentStatus}".`
                : 'Browse jobs and click "Run Automated Application" to begin applying.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Job & Company</th>
                  <th className="py-3 px-4">Profile Match</th>
                  <th className="py-3 px-4">Resume Version</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Applied / Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Job & Company */}
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/applications/${app.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-600 block text-sm"
                      >
                        {app.job?.title || 'Engineering Role'}
                      </Link>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-slate-700">{app.job?.company || 'Verified Employer'}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[10px]">{app.job?.platform}</span>
                      </div>
                      {app.job?.application_url && (
                        <div className="mt-1.5">
                          <a
                            href={app.job.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-800 hover:underline bg-brand-50/70 px-2 py-0.5 rounded border border-brand-200/70"
                            title={app.job.application_url}
                          >
                            <span>Open Applied Job Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Match Score */}
                    <td className="py-3.5 px-4">
                      {app.match ? (
                        <MatchScorePill score={app.match.overall_match_score} size="sm" />
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Resume Used */}
                    <td className="py-3.5 px-4">
                      {app.resume_version ? (
                        <Link
                          to={`/resumes/${app.resume_version.id}`}
                          className="text-brand-600 hover:underline font-medium text-xs truncate max-w-[160px] block"
                          title={app.resume_version.title}
                        >
                          {app.resume_version.title}
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-xs">Generated upon staging</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {app.applied_at
                        ? new Date(app.applied_at).toLocaleString()
                        : new Date(app.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {app.job?.application_url && (
                          <a
                            href={app.job.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary py-1 px-2 text-xs inline-flex items-center gap-1 text-brand-700 bg-brand-50/40 hover:bg-brand-50 border-brand-200"
                            title="Open external job application link"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-brand-600" />
                            <span>Link</span>
                          </a>
                        )}
                        <Link
                          to={`/applications/${app.id}`}
                          className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
