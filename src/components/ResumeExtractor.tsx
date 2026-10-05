import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useAppStore } from '../store/index.js';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FolderGit2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ResumeExtractorProps {
  onSuccess?: () => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const ResumeExtractor: React.FC<ResumeExtractorProps> = ({
  onSuccess,
  className = '',
  defaultExpanded = true,
}) => {
  const queryClient = useQueryClient();
  const { addToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutation to parse resume
  const extractMutation = useMutation({
    mutationFn: (autoSave: boolean) => {
      if (activeTab === 'upload') {
        if (!selectedFile) throw new Error('Please select a resume file (PDF, DOCX, TXT)');
        return api.extractResume(selectedFile, autoSave);
      } else {
        if (!pastedText.trim()) throw new Error('Please paste your resume text');
        return api.extractResume(pastedText, autoSave);
      }
    },
    onSuccess: (res) => {
      setExtractedData(res.data);
      if (res.applied) {
        addToast({
          type: 'success',
          title: 'Profile Updated!',
          message: 'Resume extracted and saved to Candidate Profile & Master Resume.',
        });
        queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
        queryClient.invalidateQueries({ queryKey: ['master-resume'] });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        if (onSuccess) onSuccess();
      } else {
        addToast({
          type: 'info',
          title: 'Extraction Complete',
          message: 'Review extracted fields below, then click "Apply to Profile".',
        });
      }
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Extraction Failed',
        message: err.message,
      });
    },
  });

  // Mutation to apply after review
  const applyMutation = useMutation({
    mutationFn: (data: any) => api.applyExtractedProfile(data),
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Profile Saved',
        message: 'Your profile has been updated and job match scores recalculated!',
      });
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      queryClient.invalidateQueries({ queryKey: ['master-resume'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message,
      });
    },
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setExtractedData(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setExtractedData(null);
    }
  };

  return (
    <div
      className={`card border-brand-200/80 bg-gradient-to-br from-white via-brand-50/15 to-indigo-50/20 overflow-hidden shadow-sm transition-all ${className}`}
    >
      {/* Header bar */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>AI Resume Extractor</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-100 text-brand-700 font-semibold">
                PDF &bull; DOCX &bull; TXT
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your real resume to automatically populate your profile and ground truth skills in seconds.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand Extractor'}
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Method tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button
              onClick={() => {
                setActiveTab('upload');
                setExtractedData(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('paste');
                setExtractedData(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'paste'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Raw Resume</span>
            </button>
          </div>

          {/* Upload Area */}
          {activeTab === 'upload' ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-brand-500 bg-brand-50/30'
                  : 'border-slate-300 hover:border-brand-400 bg-white/60 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{selectedFile.name}</div>
                  <div className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to choose a different file
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    Drag and drop your resume here, or <span className="text-brand-600">browse</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Supports PDF, Word (.docx), or plain text (.txt) up to 10MB
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Paste Resume Text
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the full text of your resume here..."
                rows={8}
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Extracts contact info, categorized skills, work history, and education</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => extractMutation.mutate(false)}
                disabled={
                  extractMutation.isPending ||
                  (activeTab === 'upload' ? !selectedFile : !pastedText.trim())
                }
                className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 font-semibold"
              >
                {extractMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Extract & Preview</span>
                  </>
                )}
              </button>

              <button
                onClick={() => extractMutation.mutate(true)}
                disabled={
                  extractMutation.isPending ||
                  (activeTab === 'upload' ? !selectedFile : !pastedText.trim())
                }
                className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 shadow-sm font-semibold"
              >
                {extractMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting & Saving...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Extract & Save to Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted Preview Card */}
          {extractedData && (
            <div className="mt-6 border border-emerald-200 bg-emerald-50/20 rounded-xl p-6 space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Successfully Extracted Resume Profile</span>
                </div>

                <button
                  onClick={() => applyMutation.mutate(extractedData)}
                  disabled={applyMutation.isPending}
                  className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1.5 self-start sm:self-auto font-semibold shadow-sm"
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Apply Extracted Data to Profile</span>
                    </>
                  )}
                </button>
              </div>

              {/* Grid: Extracted Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Contact & Personal */}
                <div className="bg-white p-4 rounded-lg border border-slate-200/80 space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <User className="w-3.5 h-3.5 text-brand-600" />
                    <span>Candidate Information</span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="font-bold text-slate-900 text-sm">{extractedData.full_name}</div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{extractedData.email || 'No email provided'}</span>
                    </div>
                    {extractedData.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{extractedData.phone}</span>
                      </div>
                    )}
                    {extractedData.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{extractedData.location}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 mt-1">
                      Experience: <strong>{extractedData.years_of_experience} years</strong>
                    </div>
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="bg-white p-4 rounded-lg border border-slate-200/80 space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-600" />
                    <span>Professional Summary</span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed italic">
                    "{extractedData.professional_summary || 'No summary provided in resume.'}"
                  </p>
                </div>
              </div>

              {/* Skills badges */}
              <div className="bg-white p-4 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                <div className="font-semibold text-slate-800">
                  Extracted Skills ({extractedData.skills?.length || 0})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(extractedData.skills || []).map((skill: string) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-200/70"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience list */}
              {extractedData.experience && extractedData.experience.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-slate-200/80 space-y-3 text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                    <span>Work Experience ({extractedData.experience.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {extractedData.experience.map((exp: any, i: number) => (
                      <div key={i} className="border-l-2 border-brand-500 pl-3 py-0.5">
                        <div className="font-semibold text-slate-900">{exp.role}</div>
                        <div className="text-slate-500 text-[11px]">
                          {exp.company} &bull; {exp.period}
                        </div>
                        {exp.bullets && exp.bullets[0] && (
                          <div className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                            {exp.bullets[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education list */}
              {extractedData.education && extractedData.education.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                    <span>Education</span>
                  </div>
                  <div className="space-y-1.5">
                    {extractedData.education.map((edu: any, i: number) => (
                      <div key={i} className="text-slate-700">
                        <span className="font-semibold">{edu.degree}</span> in {edu.field_of_study} &mdash;{' '}
                        <span className="text-slate-500">{edu.institution} ({edu.graduation_year})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
