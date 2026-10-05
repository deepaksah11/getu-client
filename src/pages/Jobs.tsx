import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { Link } from 'react-router-dom';
import { MatchScorePill } from '../components/MatchScorePill.js';
import { TableSkeleton } from '../components/Skeleton.js';
import { useAppStore } from '../store/index.js';
import {
  Briefcase,
  Search,
  MapPin,
  Filter,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Globe,
  Plus,
  X,
} from 'lucide-react';

export const Jobs: React.FC = () => {
  const { searchQuery, addToast, activeUserId } = useAppStore();
  const queryClient = useQueryClient();

  const [locationFilter, setLocationFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    application_url: '',
    platform: '',
    work_mode: 'Remote',
    locations: 'Remote',
    salary: 'Competitive',
    skills: '',
    description: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', activeUserId, searchQuery, locationFilter, workModeFilter],
    queryFn: () =>
      api.getJobs({
        keyword: searchQuery || undefined,
        location: locationFilter || undefined,
        work_mode: workModeFilter || undefined,
      }),
  });

  const scanMutation = useMutation({
    mutationFn: () => api.scanJobs(),
    onSuccess: (res) => {
      addToast({
        type: 'success',
        title: `Found ${res.scanned} jobs`,
        message: res.message,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Scan Failed',
        message: err.message,
      });
    },
  });

  const addJobMutation = useMutation({
    mutationFn: () =>
      api.addJob({
        title: newJob.title,
        company: newJob.company,
        application_url: newJob.application_url,
        platform: newJob.platform,
        work_mode: newJob.work_mode,
        locations: newJob.locations.split(',').map((l) => l.trim()).filter(Boolean),
        salary: newJob.salary,
        skills: newJob.skills.split(',').map((s) => s.trim()).filter(Boolean),
        description: newJob.description,
      }),
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Job Added',
        message: 'Real job opportunity added successfully!',
      });
      setShowAddModal(false);
      setNewJob({
        title: '',
        company: '',
        application_url: '',
        platform: '',
        work_mode: 'Remote',
        locations: 'Remote',
        salary: 'Competitive',
        skills: '',
        description: '',
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Add Job Failed', message: err.message });
    },
  });

  const jobs = data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Job Opportunities</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified opportunities extracted from connected job platforms and custom import URLs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 font-semibold text-brand-700 bg-brand-50 border-brand-200 hover:bg-brand-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Job by Link</span>
          </button>

          <button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shadow-sm font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{scanMutation.isPending ? 'Searching...' : 'Find jobs on my platforms'}</span>
          </button>
        </div>
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="card p-6 border-brand-300 bg-brand-50/20 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Import Job Opportunity by URL</h2>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Job Application URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                placeholder="https://unstop.com/jobs/... or https://..."
                value={newJob.application_url}
                onChange={(e) => setNewJob({ ...newJob, application_url: e.target.value })}
                className="input-text"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Platform</label>
              <input
                type="text"
                placeholder="Detected from the URL if left empty"
                value={newJob.platform}
                onChange={(e) => setNewJob({ ...newJob, platform: e.target.value })}
                className="input-text"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Full Stack Engineer"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                className="input-text"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Company <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={newJob.company}
                onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                className="input-text"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Mode</label>
              <select
                value={newJob.work_mode}
                onChange={(e) => setNewJob({ ...newJob, work_mode: e.target.value })}
                className="input-text"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Locations</label>
              <input
                type="text"
                placeholder="Remote, Bangalore, San Francisco"
                value={newJob.locations}
                onChange={(e) => setNewJob({ ...newJob, locations: e.target.value })}
                className="input-text"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Salary Range</label>
              <input
                type="text"
                placeholder="e.g. ₹35,00,000 - ₹50,00,000 / year"
                value={newJob.salary}
                onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                className="input-text"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Required Skills</label>
              <input
                type="text"
                placeholder="TypeScript, React, Node.js, PostgreSQL"
                value={newJob.skills}
                onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                className="input-text"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80">
            <button
              onClick={() => setShowAddModal(false)}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => addJobMutation.mutate()}
              disabled={
                addJobMutation.isPending ||
                !newJob.title ||
                !newJob.company ||
                !newJob.application_url
              }
              className="btn-primary py-1.5 px-4 text-xs font-semibold shadow-sm"
            >
              {addJobMutation.isPending ? 'Adding Job...' : 'Save Job Opportunity'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        {/* Location select */}
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Locations</option>
          <option value="Remote">Remote</option>
          <option value="Bangalore">Bangalore</option>
          <option value="San Francisco">San Francisco</option>
          <option value="Hyderabad">Hyderabad</option>
        </select>

        {/* Work mode select */}
        <select
          value={workModeFilter}
          onChange={(e) => setWorkModeFilter(e.target.value)}
          className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Work Modes</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Onsite">Onsite</option>
        </select>

        {(locationFilter || workModeFilter) && (
          <button
            onClick={() => {
              setLocationFilter('');
              setWorkModeFilter('');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Jobs List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">
            Failed loading jobs: {(error as any).message}
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No jobs match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your filters, or click "Find jobs on my platforms" to search the platforms you selected.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition-colors"
                    >
                      {job.title}
                    </Link>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {job.platform}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="font-medium text-slate-700">{job.company}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.locations.join(', ') || job.work_mode}
                    </span>
                    <span>&bull;</span>
                    <span className="text-emerald-700 font-medium">{job.salary}</span>
                    <span>&bull;</span>
                    <span>{job.experience_required}</span>
                  </div>

                  {/* Skills badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {job.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 6 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        +{job.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action & Match */}
                <div className="flex items-center gap-4 shrink-0 sm:self-center">
                  {job.match && (
                    <div className="flex flex-col items-end">
                      <MatchScorePill score={job.match.overall_match_score} />
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {job.match.matched_skills.length}/{job.skills.length} skills
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {job.application_url && (
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1 text-brand-700 bg-brand-50/50 hover:bg-brand-100 border-brand-200"
                        title="Open external job posting link"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-brand-600" />
                        <span>Open Link</span>
                      </a>
                    )}

                    <Link
                      to={`/jobs/${job.id}`}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
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
