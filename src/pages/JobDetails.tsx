import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { MatchScorePill } from '../components/MatchScorePill.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { CardSkeleton } from '../components/Skeleton.js';
import { useAppStore } from '../store/index.js';
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Building,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Send,
  ShieldAlert,
} from 'lucide-react';

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useAppStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['job-details', id],
    queryFn: () => api.getJob(id!),
    enabled: Boolean(id),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.analyzeJob(id!),
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Analysis Complete',
        message: 'AI extracted requirements, questions, and metadata.',
      });
      queryClient.invalidateQueries({ queryKey: ['job-details', id] });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Analysis Failed', message: err.message });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (forceProduction: boolean = false) => api.applyJob(id!, forceProduction),
    onSuccess: (res) => {
      addToast({
        type: res.success ? 'success' : 'warning',
        title: res.status,
        message: res.message,
      });
      queryClient.invalidateQueries({ queryKey: ['job-details', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (res.application?.id) {
        navigate(`/applications/${res.application.id}`);
      }
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Application Process Error', message: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="card p-8 text-center text-rose-600">
        <h3 className="font-semibold text-base">Job not found</h3>
        <button onClick={() => navigate('/jobs')} className="btn-secondary mt-3 text-xs">
          Back to Jobs
        </button>
      </div>
    );
  }

  const job = data.data;
  const match = job.match;
  const app = job.application;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        onClick={() => navigate('/jobs')}
        className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Jobs
      </button>

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-medium">
                {job.platform}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {job.external_id}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{job.title}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-600 flex-wrap">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-400" />
                {job.company}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                {job.locations.join(', ') || job.work_mode}
              </span>
              <span>&bull;</span>
              <span className="text-emerald-700 font-semibold">{job.salary}</span>
              <span>&bull;</span>
              <span>{job.experience_required}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="btn-secondary text-xs flex items-center justify-center gap-1.5"
              title="Run AI Job Description Analysis"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>{analyzeMutation.isPending ? 'Analyzing...' : 'AI Analyze JD'}</span>
            </button>

            {app ? (
              <Link
                to={`/applications/${app.id}`}
                className="btn-primary text-xs flex items-center justify-center gap-1.5"
              >
                <span>View Application</span>
                <StatusBadge status={app.status} size="sm" />
              </Link>
            ) : (
              <button
                onClick={() => applyMutation.mutate(false)}
                disabled={applyMutation.isPending}
                className="btn-primary text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{applyMutation.isPending ? 'Tailoring resume & applying (up to a minute)…' : 'Tailor resume & apply'}</span>
              </button>
            )}

            <a
              href={job.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs flex items-center justify-center gap-1"
              title="Open Target Job Portal Link"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Portal</span>
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Match Evaluation & JD Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job Description & Requirements (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Job Description
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Key Requirements
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Profile Match Breakdown & Eligibility (1 col) */}
        <div className="space-y-6">
          {match ? (
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">Profile Match Analysis</h3>
                <MatchScorePill score={match.overall_match_score} size="lg" />
              </div>

              {/* Sub-scores */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>Technical Skills (35%)</span>
                    <span>{match.skill_match_score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${match.skill_match_score}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>Experience Match (25%)</span>
                    <span>{match.experience_match_score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${match.experience_match_score}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>Education (15%)</span>
                    <span>{match.education_match_score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${match.education_match_score}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>Location & Mode (15%)</span>
                    <span>{match.location_match_score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${match.location_match_score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Matched skills */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Matched Verified Skills ({match.matched_skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {match.matched_skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing skills */}
              {match.missing_skills.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    Missing Required Skills ({match.missing_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {match.missing_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-6 text-center text-xs text-slate-500">
              Match calculation pending...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
