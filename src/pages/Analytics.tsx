import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { CardSkeleton } from '../components/Skeleton.js';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { useAppStore } from '../store/index.js';

export const Analytics: React.FC = () => {
  const { activeUserId } = useAppStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-data', activeUserId],
    queryFn: () => api.getAnalytics(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="card p-8 text-center text-rose-600">
        <h3 className="font-semibold text-base">Failed loading analytics</h3>
      </div>
    );
  }

  const an = data.data;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Platform Analytics & Intelligence</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Metrics on market skill requirements, candidate match distributions, and application performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Score Distribution */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieChart className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-slate-900">Profile Match Distribution</h2>
          </div>

          <div className="space-y-3">
            {an.match_distribution.map((dist) => (
              <div key={dist.range} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{dist.range}</span>
                  <span className="font-semibold">{dist.count} jobs</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(10, dist.count * 25))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Demanded Skills */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-semibold text-slate-900">Top Required Skills in Market</h2>
          </div>

          <div className="space-y-2.5">
            {an.top_skills.map((item) => (
              <div key={item.skill} className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800">{item.skill}</span>
                <span className="font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                  {item.count} postings
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Jobs Over Time Trend */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Discovery Activity (Last 7 Days)</h2>
          </div>

          <div className="flex items-end justify-between h-40 pt-4 px-2 gap-2 border-b border-slate-100">
            {an.jobs_over_time.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full max-w-[32px] bg-brand-500 rounded-t-sm transition-all"
                  style={{ height: `${Math.min(100, Math.max(15, d.count * 4))}%` }}
                  title={`${d.date}: ${d.count} jobs discovered`}
                />
                <span className="text-[10px] text-slate-400 font-mono">
                  {d.date.substring(5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Failure & Verification Causes */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900">Exception & Pause Classification</h2>
          </div>

          {an.failure_reasons.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No failed or paused applications recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {an.failure_reasons.map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                  <span className="text-slate-700 font-medium">{r.reason}</span>
                  <span className="font-bold text-slate-900 font-mono px-2 py-0.5 rounded bg-white border border-slate-200">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
