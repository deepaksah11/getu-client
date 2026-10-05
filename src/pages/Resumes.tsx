import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/index.js';
import {
  FileText,
  Download,
  Trash2,
  Sparkles,
  Eye,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton.js';
import { ResumeExtractor } from '../components/ResumeExtractor.js';

export const Resumes: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast, activeUserId } = useAppStore();

  const { data: masterData, isLoading: isMasterLoading } = useQuery({
    queryKey: ['master-resume', activeUserId],
    queryFn: () => api.getMasterResume(),
  });

  const { data: versionsData, isLoading: isVersionsLoading } = useQuery({
    queryKey: ['resume-versions', activeUserId],
    queryFn: () => api.getResumeVersions(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteResumeVersion(id),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Deleted', message: 'Resume version removed.' });
      queryClient.invalidateQueries({ queryKey: ['resume-versions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    },
  });

  const master = masterData?.data;
  const versions = versionsData?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Resume Engine & Versioning</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Structured Master Resume source of truth and job-specific tailored versions.
        </p>
      </div>

      {/* AI Resume Extractor */}
      <ResumeExtractor defaultExpanded={false} />

      {/* Master Resume Card */}
      <div className="card p-6 border-brand-200 bg-gradient-to-b from-white to-brand-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Master Resume (Source of Truth)</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full font-semibold">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                The Master Resume is never automatically overwritten by AI. It serves as verified ground truth.
              </p>
            </div>
          </div>

          <Link
            to="/profile"
            className="btn-secondary py-1.5 px-3 text-xs self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>Edit Profile Data</span>
          </Link>
        </div>

        {isMasterLoading ? (
          <CardSkeleton />
        ) : master ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-1">Executive Summary</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {master.content_json.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-1.5">Core Skill Categories</h3>
                <div className="space-y-2">
                  {master.content_json.skills.map((cat, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{cat.category}: </span>
                      <span className="text-slate-600">{cat.items.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-1.5">Verified Experience Records</h3>
                <div className="space-y-2">
                  {master.content_json.experience.slice(0, 2).map((exp, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="font-semibold text-slate-900">{exp.role}</div>
                      <div className="text-[11px] text-slate-500">
                        {exp.company} &bull; {exp.period}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Tailored Resume Versions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Tailored Resume Versions ({versions.length})
          </h2>
        </div>

        {isVersionsLoading ? (
          <CardSkeleton />
        ) : versions.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No tailored versions generated yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              When automation runs or you click &apos;Run Automated Application&apos; on a job, a tailored version is generated and stored here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {versions.map((ver) => (
              <div key={ver.id} className="card p-5 flex flex-col justify-between hover:border-slate-300">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {ver.template_id}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span>ATS:</span>
                      <span>{ver.ats_score}%</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug truncate">
                      {ver.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Created: {new Date(ver.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {ver.content_json.summary}
                  </p>

                  {ver.missing_keywords && ver.missing_keywords.length > 0 && (
                    <div className="text-[11px] text-slate-500">
                      <span className="font-medium text-slate-600">Missing keywords: </span>
                      <span className="text-slate-500">{ver.missing_keywords.slice(0, 3).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/resumes/${ver.id}`}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </Link>

                  <div className="flex items-center gap-1">
                    <a
                      href={api.getResumeDownloadUrl(ver.id, 'pdf')}
                      download
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => deleteMutation.mutate(ver.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      title="Delete version"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
