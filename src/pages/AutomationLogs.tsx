import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { TableSkeleton } from '../components/Skeleton.js';
import { useAppStore } from '../store/index.js';
import {
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  RotateCcw,
  Check,
} from 'lucide-react';

export const AutomationLogs: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'steps' | 'errors'>('steps');

  const { data: stepsData, isLoading: isStepsLoading } = useQuery({
    queryKey: ['automation-steps'],
    queryFn: () => api.getSteps(),
    refetchInterval: 5000,
  });

  const { data: errorsData, isLoading: isErrorsLoading } = useQuery({
    queryKey: ['automation-errors'],
    queryFn: () => api.getErrors(),
    refetchInterval: 5000,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.resolveError(id),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Resolved', message: 'Error log marked as resolved.' });
      queryClient.invalidateQueries({ queryKey: ['automation-errors'] });
    },
  });

  const steps = stepsData?.data || [];
  const errors = errorsData?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Automation Telemetry & Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time step execution timings, browser worker traces, and security verification logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('steps')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'steps'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5" />
          <span>Execution Steps ({steps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('errors')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'errors'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Error & Security Logs ({errors.length})</span>
        </button>
      </div>

      {/* Tab 1: Execution Steps */}
      {activeTab === 'steps' && (
        <div className="card overflow-hidden">
          {isStepsLoading ? (
            <div className="p-6">
              <TableSkeleton rows={8} />
            </div>
          ) : steps.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No step execution logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-sans uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Step Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Run / Context ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {steps.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {st.step_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            st.status === 'success'
                              ? 'bg-emerald-50 text-emerald-700'
                              : st.status === 'paused'
                              ? 'bg-rose-50 text-rose-700'
                              : st.status === 'warning'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{st.duration_ms}ms</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(st.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {st.run_id.substring(0, 8)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Error & Security Logs */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          {isErrorsLoading ? (
            <TableSkeleton rows={4} />
          ) : errors.length === 0 ? (
            <div className="card p-12 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>No errors or unhandled exceptions logged. System healthy.</span>
            </div>
          ) : (
            errors.map((err) => (
              <div
                key={err.id}
                className={`card p-5 border-l-4 ${
                  err.resolved
                    ? 'border-l-slate-300 opacity-60'
                    : err.error_type === 'CAPTCHA_DETECTED' || err.error_type === 'SECURITY_CHECK'
                    ? 'border-l-amber-500'
                    : 'border-l-rose-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase">
                        {err.error_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(err.created_at).toLocaleString()}
                      </span>
                      {err.resolved && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                          Resolved
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900">{err.message}</h3>

                    {err.stack && (
                      <pre className="text-[10px] font-mono text-slate-600 bg-slate-100 p-2.5 rounded overflow-x-auto mt-2">
                        {err.stack.slice(0, 300)}...
                      </pre>
                    )}
                  </div>

                  {!err.resolved && (
                    <button
                      onClick={() => resolveMutation.mutate(err.id)}
                      disabled={resolveMutation.isPending}
                      className="btn-secondary py-1 px-3 text-xs self-start shrink-0 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
