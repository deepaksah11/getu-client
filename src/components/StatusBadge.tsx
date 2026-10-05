import React from 'react';
import { ApplicationStatus } from '../types/index.js';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Sparkles,
  FileCheck,
  Send,
  HelpCircle,
  Copy,
  Ban,
} from 'lucide-react';

interface Props {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Submitted
        </span>
      );
    case 'APPLICATION_READY':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses}`}>
          <FileCheck className="w-3.5 h-3.5 text-blue-600" />
          Application Ready
        </span>
      );
    case 'RESUME_READY':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${sizeClasses}`}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Resume Tailored
        </span>
      );
    case 'MATCHED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          Profile Matched
        </span>
      );
    case 'ANALYZING':
    case 'RESUME_GENERATING':
    case 'APPLYING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 animate-pulse ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          {status === 'ANALYZING' ? 'Analyzing JD' : status === 'RESUME_GENERATING' ? 'Generating Resume' : 'Applying'}
        </span>
      );
    case 'REQUIRES_HUMAN_ACTION':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-300 shadow-sm ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          Human Action Required
        </span>
      );
    case 'FAILED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-red-50 text-red-700 border border-red-200/80 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          Failed
        </span>
      );
    case 'NOT_ELIGIBLE':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5 text-slate-500" />
          Not Eligible
        </span>
      );
    case 'DUPLICATE':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          <Copy className="w-3.5 h-3.5 text-slate-500" />
          Duplicate
        </span>
      );
    case 'DISCOVERED':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          Discovered
        </span>
      );
  }
};
