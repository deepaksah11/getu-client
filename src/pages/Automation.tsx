import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  ShieldCheck,
  ScrollText,
  Globe,
  UserCheck,
  MessageSquareText,
  Search,
  Loader2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAppStore } from '../store/index.js';
import { CardSkeleton } from '../components/Skeleton.js';

const PHASE_LABEL: Record<string, string> = {
  starting: 'Starting',
  discovering: 'Searching jobs',
  matching: 'Matching',
  applying: 'Tailoring resumes and applying',
  finished: 'Finished',
};

function timeAgo(iso?: string): string {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
}

function timeUntil(iso?: string): string {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 60000));
  return mins < 1 ? 'any moment' : mins < 60 ? `in ${mins} min` : `in ${Math.round(mins / 60)} h`;
}

const Check: React.FC<{ ok: boolean; title: string; children?: React.ReactNode; to?: string; action?: string }> = ({ ok, title, children, to, action }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {children && <div className="text-xs text-slate-600 mt-0.5 space-y-0.5">{children}</div>}
    </div>
    {to && action && (
      <Link to={to} className="text-xs font-semibold text-brand-600 hover:text-brand-800 shrink-0 mt-0.5">
        {action}
      </Link>
    )}
  </div>
);

export const Automation: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast, activeUserId } = useAppStore();

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['automation-status', activeUserId],
    queryFn: () => api.getAutomationStatus(),
    refetchInterval: (query) => (query.state.data?.data.isRunning ? 2500 : 8000),
  });
  const { data: readinessData } = useQuery({
    queryKey: ['readiness', activeUserId],
    queryFn: () => api.getReadiness(),
    refetchInterval: 15000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['automation-status'] });
    queryClient.invalidateQueries({ queryKey: ['readiness'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  };

  const runNow = useMutation({
    mutationFn: () => api.runNow(),
    onSuccess: (res) => {
      addToast({ type: 'success', title: 'Auto-apply started', message: res.message });
      refresh();
    },
    onError: (err: any) => addToast({ type: 'error', title: 'Could not start', message: err.message }),
  });
  const stop = useMutation({
    mutationFn: () => api.stopAutomation(),
    onSuccess: (res) => {
      addToast({ type: 'warning', message: res.message });
      refresh();
    },
  });
  const schedule = useMutation({
    mutationFn: (on: boolean) => (on ? api.resumeAutomation() : api.pauseAutomation()),
    onSuccess: (res) => {
      addToast({ type: 'success', message: res.message });
      refresh();
    },
  });
  const setMode = useMutation({
    mutationFn: (mode: 'dry-run' | 'production') => api.updateSettings({ automation_mode: mode }),
    onSuccess: () => {
      addToast({ type: 'success', message: 'Mode saved.' });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      refresh();
    },
    onError: (err: any) => addToast({ type: 'error', message: err.message }),
  });

  if (isLoading || !statusData) return <CardSkeleton />;

  const status = statusData.data;
  const readiness = readinessData?.data;
  const run = status.latestRun;
  const isRunning = status.isRunning;
  const mode = readiness?.mode || status.mode;
  const progress = run?.progress;
  const queuePct =
    progress?.queue_total && progress.queue_total > 0 ? Math.round(((progress.queue_done || 0) / progress.queue_total) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Automation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Searches your selected platforms using your profile, writes a resume for each job, and applies.
          </p>
        </div>
        <Link to="/automation/logs" className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 self-start sm:self-auto">
          <ScrollText className="w-3.5 h-3.5 text-slate-500" />
          <span>Execution logs</span>
        </Link>
      </div>

      {/* Control card */}
      <div className="card p-6 bg-slate-900 text-white border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isRunning ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {isRunning ? <Loader2 className="w-7 h-7 animate-spin" /> : <Cpu className="w-7 h-7" />}
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">
                {isRunning ? PHASE_LABEL[progress?.phase || 'starting'] : status.enabled ? 'Scheduled' : 'Idle'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isRunning
                  ? progress?.current_job
                    ? `${progress.platform}: ${progress.current_job}`
                    : progress?.platform
                      ? `Working on ${progress.platform}`
                      : 'Preparing…'
                  : `Last run ${timeAgo(status.lastRunAt)}${status.enabled && status.nextRunAt ? ` · next ${timeUntil(status.nextRunAt)}` : ''}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isRunning ? (
              <button
                onClick={() => stop.mutate()}
                disabled={stop.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" /> Stop
              </button>
            ) : (
              <button
                onClick={() => runNow.mutate()}
                disabled={runNow.isPending || readiness?.ready === false}
                title={readiness?.ready === false ? 'Fix the items in the checklist first' : undefined}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                {runNow.isPending ? 'Starting…' : mode === 'production' ? 'Start auto-apply now' : 'Start dry run now'}
              </button>
            )}
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 accent-brand-500"
                checked={status.enabled}
                disabled={schedule.isPending}
                onChange={(e) => schedule.mutate(e.target.checked)}
              />
              <CalendarClock className="w-4 h-4" />
              Run automatically every {status.intervalMins} min
            </label>
          </div>
        </div>

        {isRunning && progress?.queue_total ? (
          <div className="mt-5">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>{progress.platform} queue</span>
              <span>
                {progress.queue_done || 0} / {progress.queue_total}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${queuePct}%` }} />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5 mt-5 border-t border-slate-800/80">
          {[
            ['Jobs found', status.stats?.jobs_found],
            ['Matched', status.stats?.matched],
            ['Submitted', status.stats?.applied],
            ['Needs you', status.stats?.needs_attention],
            ['Failed', status.stats?.failed],
          ].map(([label, value]) => (
            <div key={label as string}>
              <span className="text-[11px] text-slate-400 block">{label}</span>
              <span className="text-lg font-bold text-white">{(value as number) || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Readiness checklist */}
        <div className="card p-6 xl:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" /> Ready to apply?
            </h2>
            {readiness && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${readiness.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {readiness.ready ? 'Ready' : 'Action needed'}
              </span>
            )}
          </div>
          {!readiness ? (
            <p className="text-xs text-slate-500 py-4">Checking…</p>
          ) : (
            <>
              <Check ok={readiness.profile.ready} title="Profile complete" to="/profile" action={readiness.profile.ready ? 'Edit' : 'Fix profile'}>
                {readiness.profile.missing.map((m) => (
                  <div key={m} className="text-rose-700">• {m}</div>
                ))}
                {readiness.profile.ready && readiness.profile.warnings.slice(0, 2).map((w) => <div key={w}>• {w}</div>)}
                {readiness.profile.ready && readiness.profile.warnings.length === 0 && <div>Applications are sent with your real details.</div>}
              </Check>
              <Check
                ok={readiness.platforms.some((p) => p.ready)}
                title={readiness.platforms.length ? `Platforms (${readiness.platforms.filter((p) => p.ready).length}/${readiness.platforms.length} ready)` : 'No platform selected'}
                to="/platforms"
                action="Manage"
              >
                {readiness.platforms.map((p) => (
                  <div key={p.id} className={p.ready ? '' : 'text-amber-700'}>
                    {p.ready ? '✓' : '•'} <strong>{p.name}</strong>: {p.reason}
                  </div>
                ))}
              </Check>
              <Check ok={readiness.pending_questions === 0} title="Screening questions" to="/profile#screening-answers" action={readiness.pending_questions ? 'Answer' : 'View'}>
                {readiness.pending_questions
                  ? `${readiness.pending_questions} question(s) from employers need your answer once; those applications resume automatically afterwards.`
                  : 'No questions waiting for you.'}
              </Check>
              <Check ok title="Job search" to="/settings" action="Change">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Search className="w-3.5 h-3.5" />
                  {readiness.search.keywords.join(', ')} · {readiness.search.locations.join(', ') || 'any location'} · last{' '}
                  {readiness.search.postedWithinDays} days · up to {readiness.search.limit} per platform
                </div>
              </Check>
              <Check ok title={readiness.ai_engine === 'gemini' ? 'AI tailoring: Gemini' : 'AI tailoring: offline engine'}>
                {readiness.ai_engine === 'gemini'
                  ? 'Resumes and answers are written with Gemini, limited to facts in your profile.'
                  : 'No GEMINI_API_KEY set: resumes are tailored by reordering your own content. Add a key for rewritten bullets and cover letters.'}
              </Check>
            </>
          )}
        </div>

        {/* Mode */}
        <div className="card p-6 xl:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-brand-600" /> Mode
          </h2>
          <button
            type="button"
            onClick={() => setMode.mutate('dry-run')}
            className={`w-full text-left p-4 rounded-xl border transition-all ${mode === 'dry-run' ? 'bg-brand-50/50 border-brand-500 ring-2 ring-brand-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Dry run (practice)</span>
              {mode === 'dry-run' && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
            </div>
            <p className="text-xs text-slate-600 mt-1">Finds jobs, tailors resumes and fills every form, then stops before submitting. Review screenshots in Applications.</p>
          </button>
          <button
            type="button"
            onClick={() => window.confirm('Live mode submits real applications in your name. Continue?') && setMode.mutate('production')}
            className={`w-full text-left p-4 rounded-xl border transition-all ${mode === 'production' ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Live (submit applications)</span>
              {mode === 'production' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Submits applications and records the platform's confirmation. Jobs prepared in dry runs are submitted on the next live run.
            </p>
          </button>
          <p className="text-[11px] text-slate-500">
            CAPTCHAs, OTPs and questions your profile cannot answer are never guessed: those applications wait in <Link className="text-brand-600 font-semibold" to="/applications">Applications</Link>.
          </p>
        </div>
      </div>

      {/* Latest run per platform */}
      {run && (
        <div className="card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-600" /> {isRunning ? 'Current run' : 'Last run'}
            </h2>
            <span className="text-[11px] text-slate-500">
              {run.status === 'running' ? 'running' : run.status} · started {timeAgo(run.started_at)}
            </span>
          </div>
          {run.error_message && (
            <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <XCircle className="w-4 h-4 shrink-0" /> {run.error_message}
            </div>
          )}
          {run.platforms && Object.keys(run.platforms).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4 font-semibold">Platform</th>
                    <th className="py-2 pr-4 font-semibold">Found</th>
                    <th className="py-2 pr-4 font-semibold">{run.status === 'running' || mode === 'production' ? 'Applied / prepared' : 'Prepared'}</th>
                    <th className="py-2 pr-4 font-semibold">Needs you</th>
                    <th className="py-2 pr-4 font-semibold">Failed</th>
                    <th className="py-2 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(run.platforms).map(([platform, s]) => (
                    <tr key={platform} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4 font-semibold text-slate-900">{platform}</td>
                      <td className="py-2 pr-4">{s.discovered}</td>
                      <td className="py-2 pr-4 text-emerald-700 font-semibold">{s.applied}</td>
                      <td className="py-2 pr-4 text-amber-700">{s.needs_action}</td>
                      <td className="py-2 pr-4 text-rose-700">{s.failed}</td>
                      <td className="py-2 text-slate-500">{s.skipped_reason || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500">{isRunning ? 'Starting…' : 'No platform activity recorded.'}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs">
        <Link to="/profile" className="btn-secondary py-1.5 px-3 text-xs">
          <UserCheck className="w-3.5 h-3.5" /> Profile
        </Link>
        <Link to="/platforms" className="btn-secondary py-1.5 px-3 text-xs">
          <Globe className="w-3.5 h-3.5" /> Platforms & logins
        </Link>
        <Link to="/profile#screening-answers" className="btn-secondary py-1.5 px-3 text-xs">
          <MessageSquareText className="w-3.5 h-3.5" /> Screening answers
        </Link>
      </div>
    </div>
  );
};
