import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { MatchScorePill } from '../components/MatchScorePill.js';
import { CardSkeleton } from '../components/Skeleton.js';
import { useAppStore } from '../store/index.js';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  FileText,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Send,
  Sparkles,
} from 'lucide-react';

export const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useAppStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['application-details', id],
    queryFn: () => api.getApplication(id!),
    enabled: Boolean(id),
    refetchInterval: 5000,
  });

  const retryMutation = useMutation({
    mutationFn: (forceProduction: boolean = false) => api.retryApplication(id!, forceProduction),
    onSuccess: (res) => {
      addToast({
        type: res.success ? 'success' : 'warning',
        title: res.status,
        message: res.message,
      });
      queryClient.invalidateQueries({ queryKey: ['application-details', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Retry Failed', message: err.message });
    },
  });

  const markSubmitted = useMutation({
    mutationFn: () => api.markApplicationSubmitted(id!),
    onSuccess: () => {
      addToast({ type: 'success', message: 'Marked as applied.' });
      queryClient.invalidateQueries({ queryKey: ['application-details', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err: any) => addToast({ type: 'error', message: err.message }),
  });

  if (isLoading) return <CardSkeleton />;
  if (error || !data?.data) {
    return (
      <div className="card p-8 text-center text-rose-600">
        <h3 className="font-semibold text-base">Application not found</h3>
        <button onClick={() => navigate('/applications')} className="btn-secondary mt-3 text-xs">
          Back to Applications
        </button>
      </div>
    );
  }

  const app = data.data;
  const isHumanAction = app.status === 'REQUIRES_HUMAN_ACTION';
  const isSubmitted = app.status === 'SUBMITTED';

  // Standard pipeline steps
  const timelineStages = [
    { name: 'Job Discovered', desc: 'Listing retrieved from platform adapter', done: true },
    {
      name: 'JD Analyzed',
      desc: 'AI extracted requirements, questions, and skills',
      done: ['ANALYZING', 'MATCHED', 'RESUME_GENERATING', 'RESUME_READY', 'APPLICATION_READY', 'APPLYING', 'SUBMITTED'].includes(app.status),
    },
    {
      name: 'Profile Matched',
      desc: 'Deterministic eligibility and score calculation',
      done: ['MATCHED', 'RESUME_GENERATING', 'RESUME_READY', 'APPLICATION_READY', 'APPLYING', 'SUBMITTED'].includes(app.status),
    },
    {
      name: 'Resume Tailored',
      desc: 'AI tailored content grounded in verified profile',
      done: ['RESUME_READY', 'APPLICATION_READY', 'APPLYING', 'SUBMITTED'].includes(app.status),
    },
    {
      name: 'Resume Generated',
      desc: 'ATS Classic PDF vector document compiled',
      done: ['RESUME_READY', 'APPLICATION_READY', 'APPLYING', 'SUBMITTED'].includes(app.status),
    },
    {
      name: 'Form Filled',
      desc: 'Deterministic selectors mapped and filled',
      done: ['APPLICATION_READY', 'APPLYING', 'SUBMITTED'].includes(app.status),
    },
    {
      name: 'Resume Uploaded',
      desc: 'File input attached with tailored PDF',
      done: ['APPLICATION_READY', 'APPLYING', 'SUBMITTED'].includes(app.status),
    },
    {
      name: 'Application Submitted',
      desc: 'Final submission receipt verified',
      done: isSubmitted,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        onClick={() => navigate('/applications')}
        className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Applications
      </button>

      {/* Human Action Required Alert Banner */}
      {isHumanAction && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">Waiting for you</h3>
              <p className="text-xs text-rose-800 mt-0.5">
                {app.requires_human_reason || 'The platform asked for a verification step (CAPTCHA, OTP or MFA). The bot never tries to bypass these.'}
              </p>
              {app.unanswered_questions && app.unanswered_questions.length > 0 && (
                <div className="text-xs text-rose-900 mt-2">
                  <span className="font-semibold">Answer once on your profile and the next run finishes this application:</span>
                  <ul className="list-disc pl-5 mt-1">
                    {app.unanswered_questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto shrink-0">
            {app.unanswered_questions && app.unanswered_questions.length > 0 && (
              <Link to="/profile#screening-answers" className="btn-secondary py-1.5 px-3 text-xs bg-white text-rose-900 border-rose-200 font-semibold">
                <HelpCircle className="w-3.5 h-3.5" /> Answer questions
              </Link>
            )}
            <button
              onClick={() => retryMutation.mutate(false)}
              disabled={retryMutation.isPending}
              className="btn-secondary py-1.5 px-3 text-xs bg-white text-rose-900 border-rose-200 hover:bg-rose-100/50 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {retryMutation.isPending ? 'Retrying…' : 'Retry now'}
            </button>
            <button
              onClick={() => markSubmitted.mutate()}
              disabled={markSubmitted.isPending}
              className="btn-secondary py-1.5 px-3 text-xs bg-white text-slate-800 font-semibold"
              title="Use this after finishing the application yourself on the platform"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> I applied myself
            </button>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={app.status} />
              {app.match && <MatchScorePill score={app.match.overall_match_score} size="sm" />}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{app.job?.title}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{app.job?.company}</span>
              <span>&bull;</span>
              <span>{app.job?.locations.join(', ') || app.job?.work_mode}</span>
              <span>&bull;</span>
              <span>ID: {app.id}</span>
            </div>

            {app.job?.application_url && (
              <div className="pt-1">
                <a
                  href={app.job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50/80 hover:bg-brand-100/70 border border-brand-200 text-xs font-medium text-brand-800 transition-colors shadow-2xs"
                  title="Direct link to target job application posting"
                >
                  <span className="font-semibold text-brand-900">Applied Job Posting URL:</span>
                  <span className="font-mono text-brand-600 truncate max-w-sm sm:max-w-md">
                    {app.job.application_url}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {app.job?.application_url && (
              <a
                href={app.job.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-sm font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Job Posting</span>
              </a>
            )}

            {app.resume_version && (
              <Link
                to={`/resumes/${app.resume_version.id}`}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-brand-600" />
                <span>View Tailored Resume</span>
              </Link>
            )}

            <button
              onClick={() => retryMutation.mutate(false)}
              disabled={retryMutation.isPending}
              className="btn-secondary text-xs flex items-center gap-1.5"
              title="Re-run automation workflow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{retryMutation.isPending ? 'Retrying...' : 'Re-run'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Timeline and Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Application Timeline (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-6">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              End-to-End Application Timeline
            </h2>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {timelineStages.map((stage, idx) => (
                <div key={stage.name} className="relative flex items-start gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-semibold ${
                      stage.done
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {stage.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className="pt-0.5">
                    <h4
                      className={`text-xs font-semibold ${
                        stage.done ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {stage.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Questions & Generated Answers */}
          {app.questions && app.questions.length > 0 && (
            <div className="card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-600" />
                Form Questions & Verified Answers
              </h2>

              <div className="space-y-3">
                {app.questions.map((q) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900">{q.question_text}</span>
                      {q.answer?.source && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shrink-0">
                          {q.answer.source === 'answer_bank' ? 'your answer' : q.answer.source === 'candidate_profile' ? 'profile' : q.answer.source === 'ai' ? 'AI (from profile)' : 'rule'}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 font-mono text-[11px] whitespace-pre-wrap">
                      {q.answer?.answer_text || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Submission Receipt & Metadata (1 col) */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Submission Receipt
            </h3>

            {isSubmitted ? (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  app.submission_verified ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`flex items-center gap-1.5 font-bold ${app.submission_verified ? 'text-emerald-950' : 'text-slate-800'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${app.submission_verified ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>{app.submission_verified ? 'Submitted: confirmed by the platform' : 'Marked as submitted'}</span>
                </div>
                {(app.submission_receipt?.confirmation_number || app.submission_receipt?.confirmationNumber) && (
                  <div className="text-[11px]">
                    <span className="font-medium">Confirmation number: </span>
                    <span className="font-mono font-bold">
                      {app.submission_receipt?.confirmation_number || app.submission_receipt?.confirmationNumber}
                    </span>
                  </div>
                )}
                <div className="text-[11px]">
                  <span className="font-medium">When: </span>
                  <span>{new Date(app.applied_at || app.submission_receipt?.timestamp || app.updated_at).toLocaleString()}</span>
                </div>
                {(app.submission_receipt?.message || app.submission_receipt?.details) && (
                  <p className="text-[11px] leading-relaxed pt-1 border-t border-slate-200/60">
                    {app.submission_receipt?.message || app.submission_receipt?.details}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                {app.status === 'APPLICATION_READY' && <p>Dry run: every field was filled and the tailored resume attached. Nothing was submitted.</p>}
                {app.status === 'FAILED' && <p className="text-rose-700">{app.failure_reason || 'The application failed.'}</p>}
                {app.status === 'NOT_ELIGIBLE' && <p>Skipped: {app.failure_reason || 'did not meet your criteria.'}</p>}
                {app.status === 'DUPLICATE' && <p>{app.failure_reason || 'You had already applied to this job.'}</p>}
                {!['APPLICATION_READY', 'FAILED', 'NOT_ELIGIBLE', 'DUPLICATE'].includes(app.status) && <p>Not submitted yet.</p>}
              </div>
            )}

            <div className="text-[11px] text-slate-500 space-y-0.5">
              {app.platform && <div>Platform: <strong className="text-slate-700">{app.platform}</strong></div>}
              {app.attempt_count ? <div>Attempts: {app.attempt_count}</div> : null}
            </div>
          </div>

          {app.screenshot_url && (
            <div className="card p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Screenshot</h3>
              <a href={api.getFileUrl(app.screenshot_url)} target="_blank" rel="noopener noreferrer" title="Open full size">
                <img
                  src={api.getFileUrl(app.screenshot_url)}
                  alt="Application form as filled by the bot"
                  className="w-full max-h-96 object-cover object-top rounded-lg border border-slate-200"
                />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
