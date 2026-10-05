import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { CardSkeleton } from '../components/Skeleton.js';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ResumeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'preview' | 'compare'>('preview');

  const { data, isLoading, error } = useQuery({
    queryKey: ['resume-version', id],
    queryFn: () => api.getResumeVersion(id!),
    enabled: Boolean(id),
  });

  const { data: masterData } = useQuery({
    queryKey: ['master-resume'],
    queryFn: () => api.getMasterResume(),
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  });
  const candidate = profileData?.data;

  if (isLoading) return <CardSkeleton />;
  if (error || !data?.data) {
    return (
      <div className="card p-8 text-center text-rose-600">
        <h3 className="font-semibold text-base">Resume version not found</h3>
        <button onClick={() => navigate('/resumes')} className="btn-secondary mt-3 text-xs">
          Back to Resumes
        </button>
      </div>
    );
  }

  const ver = data.data;
  const master = masterData?.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/resumes')}
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Resumes
        </button>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Document Preview
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'compare'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Compare with Master
            </button>
          </div>

          <a
            href={api.getResumeDownloadUrl(ver.id, 'pdf')}
            download
            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>

          <a
            href={api.getResumeDownloadUrl(ver.id, 'docx')}
            download
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download DOCX</span>
          </a>
        </div>
      </div>

      {/* Header Info */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold border border-brand-200">
                Template: {ver.template_id}
              </span>
              <span className="text-xs text-slate-400">
                Generated: {new Date(ver.created_at).toLocaleString()}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">{ver.title}</h1>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900">{ver.ats_score}%</div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">ATS Score</div>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="text-center">
              <div className="text-lg font-bold text-teal-700">
                {ver.ats_feedback?.keyword_coverage || 85}%
              </div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Keywords</div>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="text-center">
              <div className="text-lg font-bold text-brand-700">
                {ver.ats_feedback?.formatting_score || 100}%
              </div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Formatting</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode 1: Document Preview */}
      {viewMode === 'preview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Canvas (2 cols) */}
          <div className="lg:col-span-2 card p-8 bg-white border border-slate-300 shadow-sm font-sans space-y-6">
            <div className="border-b border-slate-200 pb-4 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{candidate?.full_name || 'Candidate'}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {[candidate?.email, candidate?.phone, candidate?.location].filter(Boolean).join(' • ')}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 mb-2">
                Professional Summary
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {ver.content_json.summary}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 mb-2">
                Technical Skills
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                {ver.content_json.skills.map((cat, i) => (
                  <div key={i}>
                    <strong className="font-semibold text-slate-900">{cat.category}: </strong>
                    <span>{cat.items.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 mb-3">
                Experience
              </h3>
              <div className="space-y-4">
                {ver.content_json.experience.map((exp, i) => (
                  <div key={i} className="text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>
                        {exp.role} <span className="font-normal text-slate-500">&mdash; {exp.company}</span>
                      </span>
                      <span className="font-normal text-slate-500">{exp.period}</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="leading-relaxed">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ATS Feedback Sidebar */}
          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
                ATS Compatibility Assessment
              </h3>

              {ver.missing_keywords && ver.missing_keywords.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Missing Target Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ver.missing_keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ver.ats_feedback?.issues && ver.ats_feedback.issues.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Actionable Observations
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {ver.ats_feedback.issues.map((iss, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{iss}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: Compare with Master */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Master Resume</h3>
            </div>
            <div className="text-xs text-slate-700 space-y-3">
              <div>
                <strong className="block text-slate-900 mb-1">Summary</strong>
                <p className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  {master?.content_json.summary}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-3 border-brand-200 bg-brand-50/10">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">Tailored Resume (This Version)</h3>
            </div>
            <div className="text-xs text-slate-700 space-y-3">
              <div>
                <strong className="block text-slate-900 mb-1">Tailored Summary</strong>
                <p className="bg-white p-2.5 rounded border border-brand-200 text-brand-950 font-medium">
                  {ver.content_json.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
