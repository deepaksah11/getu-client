import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { Link } from 'react-router-dom';
import { CardSkeleton } from '../components/Skeleton.js';
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
  Bookmark,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  GraduationCap,
  DollarSign,
  Building2,
  Calendar,
  ShieldCheck,
  Layers,
  Send,
  RefreshCw,
  FileText,
  Check,
  SlidersHorizontal,
  ChevronDown,
  Users,
  Building,
  ArrowUpDown,
  Share2,
  AlertCircle,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { NormalizedJob, LiveJobFilterOptions, ApplicationStatus } from '../types/index.js';

interface SavedSearchItem {
  id: string;
  name: string;
  params: LiveJobFilterOptions;
  createdAt: string;
}

export const Jobs: React.FC = () => {
  const { searchQuery, setSearchQuery, addToast, activeUserId } = useAppStore();
  const queryClient = useQueryClient();

  // Location search input state
  const [locationInput, setLocationInput] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'drives' | 'saved' | 'walkin'>('all');

  // Filter Drawer & State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('all');
  const [onlyFreshers, setOnlyFreshers] = useState<boolean>(false);
  const [onlyBulkHiring, setOnlyBulkHiring] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedEducation, setSelectedEducation] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [postedWithinDays, setPostedWithinDays] = useState<number | undefined>(undefined);
  const [onlyVerifiedLive, setOnlyVerifiedLive] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'relevance' | 'salary_high' | 'experience_low' | 'deadline'>('newest');
  const [excludedKeywords, setExcludedKeywords] = useState<string>('');
  const [minSalaryInput, setMinSalaryInput] = useState<string>('');
  const [maxSalaryInput, setMaxSalaryInput] = useState<string>('');

  // Modals & Drawers
  const [selectedJobForDrawer, setSelectedJobForDrawer] = useState<NormalizedJob | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>(() => {
    try {
      const stored = localStorage.getItem('autoapply_saved_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Application tracker in drawer
  const [applicationStatus, setApplicationStatus] = useState<string>('applied');
  const [applicationNotes, setApplicationNotes] = useState<string>('');

  // Manual job creation state
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    application_url: '',
    platform: 'Direct Portals',
    work_mode: 'Remote',
    locations: 'Delhi NCR',
    salary: '₹5,00,000 - ₹8,00,000 / year',
    skills: 'Java, Spring Boot, React',
    education_required: 'BCA, B.Tech, MCA',
    experience_required: 'Fresher (0 - 1 Yr)',
    job_type: 'full_time',
    recruitment_type: 'regular',
    description: '',
  });

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Sync drawer application fields when selecting a job
  useEffect(() => {
    if (selectedJobForDrawer) {
      setApplicationStatus(selectedJobForDrawer.application?.status || 'applied');
      setApplicationNotes(selectedJobForDrawer.application?.requires_human_reason || '');
    }
  }, [selectedJobForDrawer]);

  // Persist saved searches to localStorage
  const saveSearchToStorage = (name: string) => {
    if (!name.trim()) return;
    const newItem: SavedSearchItem = {
      id: `search-${Date.now()}`,
      name: name.trim(),
      params: { ...filterParams },
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...savedSearches.slice(0, 9)];
    setSavedSearches(updated);
    try {
      localStorage.setItem('autoapply_saved_searches', JSON.stringify(updated));
    } catch {}
    setShowSaveSearchModal(false);
    setSavedSearchName('');
    addToast({
      type: 'success',
      title: 'Search Saved',
      message: `"${newItem.name}" saved to your search bookmarks.`,
    });
  };

  const loadSavedSearch = (item: SavedSearchItem) => {
    if (item.params.keyword) setSearchQuery(item.params.keyword);
    if (item.params.locations?.[0]) setSelectedLocation(item.params.locations[0]);
    if (item.params.work_modes?.[0]) setSelectedWorkMode(item.params.work_modes[0]);
    if (item.params.experience_level) setExperienceLevel(item.params.experience_level);
    if (item.params.only_freshers !== undefined) setOnlyFreshers(item.params.only_freshers);
    if (item.params.only_bulk_hiring !== undefined) setOnlyBulkHiring(item.params.only_bulk_hiring);
    if (item.params.roles?.[0]) setSelectedRole(item.params.roles[0]);
    if (item.params.technologies?.[0]) setSelectedTech(item.params.technologies[0]);
    if (item.params.education?.[0]) setSelectedEducation(item.params.education[0]);
    if (item.params.platforms?.[0]) setSelectedPlatform(item.params.platforms[0]);
    if (item.params.posted_within_days) setPostedWithinDays(item.params.posted_within_days);
    if (item.params.verification_status === 'verified_live') setOnlyVerifiedLive(true);
    addToast({
      type: 'info',
      title: 'Saved Search Loaded',
      message: `Applied filters from "${item.name}".`,
    });
  };

  const removeSavedSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    try {
      localStorage.setItem('autoapply_saved_searches', JSON.stringify(updated));
    } catch {}
    addToast({ type: 'info', title: 'Search Removed', message: 'Saved search removed.' });
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setLocationInput('');
    setSelectedLocation('');
    setSelectedWorkMode('');
    setExperienceLevel('all');
    setOnlyFreshers(false);
    setOnlyBulkHiring(false);
    setSelectedRole('');
    setSelectedTech('');
    setSelectedEducation('');
    setSelectedPlatform('');
    setPostedWithinDays(undefined);
    setOnlyVerifiedLive(false);
    setExcludedKeywords('');
    setMinSalaryInput('');
    setMaxSalaryInput('');
    setSortBy('newest');
    addToast({ type: 'info', title: 'Filters Reset', message: 'All filters cleared to defaults.' });
  };

  // Active filters list for display as removable chips
  const activeFilters = useMemo(() => {
    const list: { id: string; label: string; onRemove: () => void }[] = [];

    if (searchQuery) {
      list.push({ id: 'keyword', label: `Keyword: "${searchQuery}"`, onRemove: () => setSearchQuery('') });
    }
    if (selectedLocation) {
      list.push({ id: 'loc', label: `Location: ${selectedLocation}`, onRemove: () => setSelectedLocation('') });
    }
    if (locationInput && locationInput !== selectedLocation) {
      list.push({ id: 'locInput', label: `Location: ${locationInput}`, onRemove: () => setLocationInput('') });
    }
    if (selectedWorkMode) {
      list.push({ id: 'mode', label: `Mode: ${selectedWorkMode}`, onRemove: () => setSelectedWorkMode('') });
    }
    if (experienceLevel !== 'all') {
      list.push({ id: 'exp', label: `Exp: ${experienceLevel} yrs`, onRemove: () => setExperienceLevel('all') });
    }
    if (onlyFreshers) {
      list.push({ id: 'fresher', label: 'Freshers Eligible (0-1 yr)', onRemove: () => setOnlyFreshers(false) });
    }
    if (onlyBulkHiring) {
      list.push({ id: 'bulk', label: 'Bulk Hiring & Drives', onRemove: () => setOnlyBulkHiring(false) });
    }
    if (selectedRole) {
      list.push({ id: 'role', label: `Role: ${selectedRole}`, onRemove: () => setSelectedRole('') });
    }
    if (selectedTech) {
      list.push({ id: 'tech', label: `Tech: ${selectedTech}`, onRemove: () => setSelectedTech('') });
    }
    if (selectedEducation) {
      list.push({ id: 'edu', label: `Edu: ${selectedEducation}`, onRemove: () => setSelectedEducation('') });
    }
    if (selectedPlatform) {
      list.push({ id: 'plat', label: `Source: ${selectedPlatform}`, onRemove: () => setSelectedPlatform('') });
    }
    if (postedWithinDays) {
      list.push({ id: 'days', label: `Posted: Last ${postedWithinDays}d`, onRemove: () => setPostedWithinDays(undefined) });
    }
    if (onlyVerifiedLive) {
      list.push({ id: 'verified', label: 'Verified Live Only', onRemove: () => setOnlyVerifiedLive(false) });
    }
    if (minSalaryInput) {
      list.push({ id: 'minSal', label: `Min CTC: ₹${Number(minSalaryInput).toLocaleString()}`, onRemove: () => setMinSalaryInput('') });
    }
    if (maxSalaryInput) {
      list.push({ id: 'maxSal', label: `Max CTC: ₹${Number(maxSalaryInput).toLocaleString()}`, onRemove: () => setMaxSalaryInput('') });
    }
    if (excludedKeywords) {
      list.push({ id: 'exKw', label: `Exclude: ${excludedKeywords}`, onRemove: () => setExcludedKeywords('') });
    }
    return list;
  }, [
    searchQuery,
    selectedLocation,
    locationInput,
    selectedWorkMode,
    experienceLevel,
    onlyFreshers,
    onlyBulkHiring,
    selectedRole,
    selectedTech,
    selectedEducation,
    selectedPlatform,
    postedWithinDays,
    onlyVerifiedLive,
    minSalaryInput,
    maxSalaryInput,
    excludedKeywords,
  ]);

  // Build filter query object
  const filterParams: LiveJobFilterOptions = useMemo(() => {
    const loc = selectedLocation || locationInput || undefined;
    const p: LiveJobFilterOptions = {
      keyword: searchQuery || undefined,
      locations: loc ? [loc] : undefined,
      work_modes: selectedWorkMode ? [selectedWorkMode] : undefined,
      experience_level: experienceLevel !== 'all' ? (experienceLevel as any) : undefined,
      only_freshers: onlyFreshers || undefined,
      only_bulk_hiring: activeTab === 'drives' ? true : onlyBulkHiring || undefined,
      only_bookmarked: activeTab === 'saved' ? true : undefined,
      recruitment_types: activeTab === 'walkin' ? ['walk_in'] : undefined,
      roles: selectedRole ? [selectedRole] : undefined,
      technologies: selectedTech ? [selectedTech] : undefined,
      education: selectedEducation ? [selectedEducation] : undefined,
      platforms: selectedPlatform ? [selectedPlatform] : undefined,
      posted_within_days: postedWithinDays,
      min_salary: minSalaryInput ? Number(minSalaryInput) : undefined,
      max_salary: maxSalaryInput ? Number(maxSalaryInput) : undefined,
      verification_status: onlyVerifiedLive ? 'verified_live' : undefined,
      excluded_keywords: excludedKeywords ? excludedKeywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
      sort_by: activeTab === 'recommended' ? 'relevance' : sortBy,
      limit: 100,
    };
    return p;
  }, [
    searchQuery,
    selectedLocation,
    locationInput,
    selectedWorkMode,
    experienceLevel,
    onlyFreshers,
    onlyBulkHiring,
    activeTab,
    selectedRole,
    selectedTech,
    selectedEducation,
    selectedPlatform,
    postedWithinDays,
    minSalaryInput,
    maxSalaryInput,
    onlyVerifiedLive,
    excludedKeywords,
    sortBy,
  ]);

  // Query Jobs
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['jobs', activeUserId, filterParams],
    queryFn: () => api.getJobs(filterParams),
  });

  // Query Sources
  const { data: sourcesData } = useQuery({
    queryKey: ['job-sources'],
    queryFn: () => api.getJobSources(),
    staleTime: 60000,
  });

  // Live Multi-Source Scan Mutation
  const liveSearchMutation = useMutation({
    mutationFn: () => api.triggerLiveSearch(),
    onSuccess: (res) => {
      addToast({
        type: 'success',
        title: 'Multi-Source Scan Finished',
        message: res.message,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Scan Encountered Error',
        message: err.message,
      });
    },
  });

  // Freshness Verification Mutation
  const verifyJobMutation = useMutation({
    mutationFn: (jobId: string) => api.verifyJob(jobId),
    onSuccess: (res) => {
      addToast({
        type: res.verification.status === 'verified_live' ? 'success' : res.verification.status === 'closed' ? 'error' : 'warning',
        title: `Verification: ${res.verification.status.toUpperCase()}`,
        message: res.verification.message,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      if (selectedJobForDrawer && selectedJobForDrawer.id === res.data.id) {
        setSelectedJobForDrawer(res.data);
      }
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Verification Failed', message: err.message });
    },
  });

  // Bookmark Mutation
  const bookmarkMutation = useMutation({
    mutationFn: ({ jobId, isBookmarked }: { jobId: string; isBookmarked: boolean }) =>
      isBookmarked ? api.unbookmarkJob(jobId) : api.bookmarkJob(jobId),
    onSuccess: (_, variables) => {
      addToast({
        type: 'success',
        title: variables.isBookmarked ? 'Removed from Saved' : 'Saved to Shortlist',
        message: variables.isBookmarked ? 'Job removed from your saved list.' : 'Job saved to your candidate shortlist.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      if (selectedJobForDrawer && selectedJobForDrawer.id === variables.jobId) {
        setSelectedJobForDrawer((prev) => (prev ? { ...prev, is_bookmarked: !variables.isBookmarked } : null));
      }
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Bookmark Error', message: err.message });
    },
  });

  // Track Application Status Mutation
  const trackApplicationMutation = useMutation({
    mutationFn: ({ jobId, status, notes }: { jobId: string; status: string; notes?: string }) =>
      api.trackApplication(jobId, status, notes),
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: 'Application tracking status and candidate notes recorded.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Tracking Error', message: err.message });
    },
  });

  // Custom Job Add Mutation
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
        education_required: newJob.education_required.split(',').map((e) => e.trim()).filter(Boolean),
        experience_required: newJob.experience_required,
        job_type: newJob.job_type as any,
        recruitment_type: newJob.recruitment_type as any,
      }),
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Job Added',
        message: 'Custom job posting created and added to search index.',
      });
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setNewJob({
        title: '',
        company: '',
        application_url: '',
        platform: 'Direct Portals',
        work_mode: 'Remote',
        locations: 'Delhi NCR',
        salary: '₹5,00,000 - ₹8,00,000 / year',
        skills: 'Java, Spring Boot, React',
        education_required: 'BCA, B.Tech, MCA',
        experience_required: 'Fresher (0 - 1 Yr)',
        job_type: 'full_time',
        recruitment_type: 'regular',
        description: '',
      });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed to Add Job', message: err.message });
    },
  });

  const jobsList = data?.data || [];
  const totalCount = data?.pagination?.total ?? jobsList.length;

  // Filter counts for tabs
  const drivesCount = useMemo(() => {
    return jobsList.filter((j) => j.is_bulk_hiring || (j.recruitment_type && j.recruitment_type !== 'regular')).length;
  }, [jobsList]);

  const savedCount = useMemo(() => {
    return jobsList.filter((j) => j.is_bookmarked).length;
  }, [jobsList]);

  // Similar jobs calculation for drawer
  const similarJobs = useMemo(() => {
    if (!selectedJobForDrawer) return [];
    return jobsList
      .filter((j) => j.id !== selectedJobForDrawer.id)
      .slice(0, 3);
  }, [selectedJobForDrawer, jobsList]);

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Job Discovery</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live Verified
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated from LinkedIn, Naukri, Indeed, Internshala, company career pages, and bulk hiring drives.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Saved Searches Dropdown */}
          {savedSearches.length > 0 && (
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
              >
                <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                <span>Saved Searches ({savedSearches.length})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="hidden group-hover:block absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1.5">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Load Search
                </div>
                {savedSearches.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => loadSavedSearch(s)}
                    className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                  >
                    <span className="font-medium truncate max-w-[170px]">{s.name}</span>
                    <button
                      onClick={(e) => removeSavedSearch(s.id, e)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                      title="Delete saved search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh / Scan Portals Button */}
          <button
            type="button"
            onClick={() => liveSearchMutation.mutate()}
            disabled={liveSearchMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs disabled:opacity-50"
            title="Scan all connected job portals and career pages"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${liveSearchMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{liveSearchMutation.isPending ? 'Scanning Portals...' : 'Scan Portals'}</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1">
                <a
                  href={api.getJobExportUrl('csv')}
                  download="jobs_export.csv"
                  onClick={() => setShowExportMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download CSV</span>
                </a>
                <a
                  href={api.getJobExportUrl('json')}
                  download="jobs_export.json"
                  onClick={() => setShowExportMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Download JSON</span>
                </a>
              </div>
            )}
          </div>

          {/* Add Job Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Job</span>
          </button>
        </div>
      </div>

      {/* 2. Prominent Dual Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-2.5 sm:p-3">
        <div className="flex flex-col md:flex-row items-stretch gap-2">
          {/* Keyword Search Input */}
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Job title, skills (Java, Spring Boot, React), company, or role..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border-0 focus:ring-0 text-slate-900 placeholder:text-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 mr-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Location Search Input */}
          <div className="flex-1 md:max-w-xs relative flex items-center border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-2">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 md:left-5 pointer-events-none" />
            <input
              type="text"
              value={selectedLocation || locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setSelectedLocation(e.target.value);
              }}
              placeholder="City, Delhi NCR, Noida, Remote..."
              className="w-full pl-9 md:pl-9 pr-3 py-2.5 text-sm bg-transparent border-0 focus:ring-0 text-slate-900 placeholder:text-slate-400 outline-none"
            />
            {(selectedLocation || locationInput) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedLocation('');
                  setLocationInput('');
                }}
                className="p-1 mr-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Controls */}
          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                activeFilters.length > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* Save Search Trigger */}
            <button
              type="button"
              onClick={() => setShowSaveSearchModal(true)}
              className="inline-flex items-center gap-1 px-3 py-2.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Save this search query"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Chips Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Quick Suggestions:
          </span>

          {/* Location Quick Chips */}
          <button
            type="button"
            onClick={() => setSelectedLocation(selectedLocation === 'Delhi NCR' ? '' : 'Delhi NCR')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selectedLocation === 'Delhi NCR'
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            📍 Delhi NCR
          </button>
          <button
            type="button"
            onClick={() => setSelectedLocation(selectedLocation === 'Noida' ? '' : 'Noida')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selectedLocation === 'Noida'
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            📍 Noida
          </button>
          <button
            type="button"
            onClick={() => setSelectedLocation(selectedLocation === 'Gurugram' ? '' : 'Gurugram')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selectedLocation === 'Gurugram'
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            📍 Gurugram
          </button>
          <button
            type="button"
            onClick={() => setSelectedWorkMode(selectedWorkMode === 'Remote' ? '' : 'Remote')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selectedWorkMode === 'Remote'
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🌐 Remote
          </button>

          {/* Fresher & BCA Chips */}
          <button
            type="button"
            onClick={() => setOnlyFreshers(!onlyFreshers)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              onlyFreshers
                ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            🎓 Freshers (0-1 yr)
          </button>
          <button
            type="button"
            onClick={() => setSelectedEducation(selectedEducation === 'BCA' ? '' : 'BCA')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selectedEducation === 'BCA'
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            📜 BCA Eligible
          </button>

          {/* Tech stack chips */}
          <button
            type="button"
            onClick={() => setSelectedTech(selectedTech === 'Spring Boot' ? '' : 'Spring Boot')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selectedTech === 'Spring Boot'
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Spring Boot
          </button>
          <button
            type="button"
            onClick={() => setSelectedTech(selectedTech === 'React' ? '' : 'React')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selectedTech === 'React'
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            React.js
          </button>
          <button
            type="button"
            onClick={() => setSelectedTech(selectedTech === 'Node.js' ? '' : 'Node.js')}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selectedTech === 'Node.js'
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Node.js
          </button>
        </div>
      </div>

      {/* 3. Active Filters Strip (Visible when any filter is active) */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-lg text-xs">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Active Filters ({activeFilters.length}):
          </span>

          {activeFilters.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 font-medium shadow-2xs"
            >
              <span>{f.label}</span>
              <button
                type="button"
                onClick={f.onRemove}
                className="hover:text-rose-600 text-slate-400 rounded transition-colors"
                title={`Remove ${f.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={handleClearAllFilters}
            className="ml-auto inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        </div>
      )}

      {/* 4. Advanced Filter Drawer (Collapsible) */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Advanced Filter Controls</h2>
            </div>
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Experience Level */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Experience Levels</option>
                <option value="fresher">Fresher (0 - 1 yr)</option>
                <option value="0-1">0 - 1 Year</option>
                <option value="1-2">1 - 2 Years</option>
                <option value="2-3">2 - 3 Years</option>
                <option value="3-5">3 - 5 Years</option>
                <option value="5+">5+ Years</option>
              </select>
            </div>

            {/* Work Mode */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Work Mode</label>
              <select
                value={selectedWorkMode}
                onChange={(e) => setSelectedWorkMode(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Any Work Mode</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            {/* Education Degree */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Education / Qualification</label>
              <select
                value={selectedEducation}
                onChange={(e) => setSelectedEducation(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Any Degree / All Graduates</option>
                <option value="BCA">BCA (Computer Applications)</option>
                <option value="B.Tech">B.Tech / B.E.</option>
                <option value="MCA">MCA (Master of Computer Applications)</option>
                <option value="B.Sc">B.Sc (IT / CS)</option>
              </select>
            </div>

            {/* Source Platform */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Source Portal / Board</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Portals & Career Sites</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Naukri">Naukri.com</option>
                <option value="Indeed">Indeed</option>
                <option value="Internshala">Internshala</option>
                <option value="Unstop">Unstop (Hiring Drives)</option>
                <option value="Foundit">Foundit (Monster)</option>
                <option value="TimesJobs">TimesJobs</option>
                <option value="Cutshort">Cutshort</option>
                <option value="Instahyre">Instahyre</option>
                <option value="Wellfound">Wellfound</option>
                <option value="Glassdoor">Glassdoor</option>
                <option value="Greenhouse">Greenhouse Portals</option>
                <option value="Lever">Lever Portals</option>
                <option value="Ashby">Ashby Portals</option>
                <option value="BulkDrives">Bulk Drives (TCS, Infosys, etc.)</option>
                <option value="Direct Portals">Direct Employer Sites</option>
              </select>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Min Annual CTC (₹)</label>
              <input
                type="number"
                value={minSalaryInput}
                onChange={(e) => setMinSalaryInput(e.target.value)}
                placeholder="e.g. 400000"
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Max Annual CTC (₹)</label>
              <input
                type="number"
                value={maxSalaryInput}
                onChange={(e) => setMaxSalaryInput(e.target.value)}
                placeholder="e.g. 1200000"
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Posting Date Freshness */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Posting Freshness</label>
              <select
                value={postedWithinDays === undefined ? '' : String(postedWithinDays)}
                onChange={(e) => setPostedWithinDays(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Any Time</option>
                <option value="1">Last 24 Hours</option>
                <option value="3">Last 3 Days</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
              </select>
            </div>

            {/* Excluded Keywords */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Exclude Negative Keywords</label>
              <input
                type="text"
                value={excludedKeywords}
                onChange={(e) => setExcludedKeywords(e.target.value)}
                placeholder="sales, unpaid, marketing (comma separated)"
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyVerifiedLive}
                onChange={(e) => setOnlyVerifiedLive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-700">Strictly Verified Live Postings Only</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyBulkHiring}
                onChange={(e) => setOnlyBulkHiring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-700">Bulk Hiring Campaigns & Drives</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyFreshers}
                onChange={(e) => setOnlyFreshers(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-700">Accepts Freshers (0 - 1 yr exp)</span>
            </label>
          </div>
        </div>
      )}

      {/* 5. Navigation Tabs & Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Opportunities</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recommended')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'recommended'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Recommended for You</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drives')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'drives'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Bulk Hiring & Drives</span>
            {drivesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                {drivesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('walkin')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'walkin'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Walk-in Interviews</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-500" />
            <span>Saved Jobs</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                {savedCount}
              </span>
            )}
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 pb-2 sm:pb-0">
          <span className="text-[11px] font-medium text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          >
            <option value="newest">Newest First</option>
            <option value="relevance">Candidate Match Score</option>
            <option value="salary_high">Highest Salary</option>
            <option value="experience_low">Fresher / Low Experience</option>
            <option value="deadline">Application Deadline</option>
          </select>
        </div>
      </div>

      {/* 6. Jobs List & Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white border border-rose-200 rounded-xl space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900">Failed to Load Opportunities</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {(error as any)?.message || 'Could not communicate with the job index API.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : jobsList.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No Matching Live Vacancies Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords, broadening your location (e.g. "Delhi NCR" or "Remote"), or clearing selected filters.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Reset All Filters
            </button>
            <button
              type="button"
              onClick={() => liveSearchMutation.mutate()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Scan Active Portals
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobsList.map((job) => {
            const isVerified = job.verification_status === 'verified_live';
            const isClosed = job.verification_status === 'closed';
            const isBulk = job.is_bulk_hiring || job.recruitment_type === 'bulk_hiring' || job.recruitment_type === 'fresher_drive';
            const isWalkIn = job.recruitment_type === 'walk_in' || !!job.walk_in_details;
            const acceptsFresher =
              job.min_experience_years === 0 ||
              (job.experience_required && job.experience_required.toLowerCase().includes('fresher'));

            return (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Company Avatar / Logo */}
                      <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden font-bold text-slate-700 text-sm shadow-2xs">
                        {job.company_logo ? (
                          <img
                            src={job.company_logo}
                            alt={job.company}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{job.company.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>

                      {/* Title & Company */}
                      <div>
                        <h3
                          onClick={() => setSelectedJobForDrawer(job)}
                          className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer leading-tight line-clamp-1"
                        >
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{job.company}</p>
                      </div>
                    </div>

                    {/* Bookmark Action */}
                    <button
                      type="button"
                      onClick={() =>
                        bookmarkMutation.mutate({
                          jobId: job.id,
                          isBookmarked: !!job.is_bookmarked,
                        })
                      }
                      className={`p-1.5 rounded-lg border transition-colors ${
                        job.is_bookmarked
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-50'
                      }`}
                      title={job.is_bookmarked ? 'Remove from saved' : 'Save job to shortlist'}
                    >
                      <Bookmark className={`w-4 h-4 ${job.is_bookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Verification & Campaign Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {/* Status Badge */}
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Live
                      </span>
                    ) : isClosed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Closed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Unverified
                      </span>
                    )}

                    {/* Bulk Hiring Badge */}
                    {isBulk && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <Users className="w-3 h-3 text-purple-600" />
                        Bulk Hiring Drive
                      </span>
                    )}

                    {/* Walk-in Badge */}
                    {isWalkIn && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        Walk-in Interview
                      </span>
                    )}

                    {/* Fresher Badge */}
                    {acceptsFresher && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                        <GraduationCap className="w-3 h-3 text-teal-600" />
                        Freshers Eligible
                      </span>
                    )}

                    {/* Match Score Badge */}
                    {job.match && (
                      <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        {job.match.overall_match_score}% Match
                      </span>
                    )}
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs text-slate-600 mt-3.5 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.locations?.join(', ') || 'Remote'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.experience_required || '0 - 2 Yrs'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold text-slate-800">{job.salary || 'Best in Industry'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.education_required?.join(', ') || 'Any Graduate'}</span>
                    </div>
                  </div>

                  {/* Walk-in Notice Strip (if walk-in) */}
                  {job.walk_in_details && (
                    <div className="mt-2.5 p-2 bg-blue-50/70 border border-blue-200/80 rounded-lg text-[11px] text-blue-900">
                      <span className="font-semibold">Walk-in Schedule: </span>
                      <span>{job.walk_in_details.dates} ({job.walk_in_details.time})</span>
                      <span className="block truncate text-blue-700 text-[10px] mt-0.5">
                        Venue: {job.walk_in_details.venue}
                      </span>
                    </div>
                  )}

                  {/* Tech Skills Chips */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {job.skills.slice(0, 4).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          +{job.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description Snippet */}
                  <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  {/* Multi-Source Links */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                    <span>Source:</span>
                    {job.sources && job.sources.length > 1 ? (
                      <span className="font-semibold text-slate-700">
                        {job.sources.map((s) => s.platform).join(', ')}
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-700">{job.platform}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedJobForDrawer(job)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      View Details
                    </button>
                    <a
                      href={job.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
                    >
                      <span>Apply</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Slide-Out Job Details Drawer */}
      {selectedJobForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedJobForDrawer(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Opportunity Details
                </span>
                {selectedJobForDrawer.verification_status === 'verified_live' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    VERIFIED LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    {selectedJobForDrawer.verification_status?.toUpperCase() || 'UNVERIFIED'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs">
              {/* Job Title & Company Banner */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden font-bold text-slate-700 text-lg shadow-xs">
                  {selectedJobForDrawer.company_logo ? (
                    <img
                      src={selectedJobForDrawer.company_logo}
                      alt={selectedJobForDrawer.company}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{selectedJobForDrawer.company.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedJobForDrawer.title}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {selectedJobForDrawer.company}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedJobForDrawer.industry || 'IT & Software Development'} • {selectedJobForDrawer.company_size || 'Established'}
                  </p>
                </div>
              </div>

              {/* Primary Sticky Action Strip */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={selectedJobForDrawer.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <span>Apply on {selectedJobForDrawer.platform}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() =>
                    bookmarkMutation.mutate({
                      jobId: selectedJobForDrawer.id,
                      isBookmarked: !!selectedJobForDrawer.is_bookmarked,
                    })
                  }
                  className={`px-3 py-2.5 text-xs font-semibold rounded-lg border transition-colors ${
                    selectedJobForDrawer.is_bookmarked
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 inline mr-1 ${selectedJobForDrawer.is_bookmarked ? 'fill-current' : ''}`} />
                  {selectedJobForDrawer.is_bookmarked ? 'Shortlisted' : 'Save'}
                </button>

                <button
                  type="button"
                  onClick={() => verifyJobMutation.mutate(selectedJobForDrawer.id)}
                  disabled={verifyJobMutation.isPending}
                  className="px-3 py-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
                  title="Check live HTTP availability"
                >
                  <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${verifyJobMutation.isPending ? 'animate-spin' : ''}`} />
                  Verify Link
                </button>
              </div>

              {/* Freshness Status Card */}
              {selectedJobForDrawer.verification_details && (
                <div
                  className={`p-3 rounded-lg border text-[11px] ${
                    selectedJobForDrawer.verification_status === 'verified_live'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : selectedJobForDrawer.verification_status === 'closed'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                      : 'bg-amber-50/70 border-amber-200 text-amber-800'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Real-Time Freshness Verification</span>
                  </div>
                  <p className="mt-1">{selectedJobForDrawer.verification_details.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Last Checked: {new Date(selectedJobForDrawer.verification_details.checked_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Quick Facts Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Salary / CTC</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">{selectedJobForDrawer.salary || 'Undisclosed'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Experience</span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{selectedJobForDrawer.experience_required || '0 - 2 Yrs'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Locations</span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{selectedJobForDrawer.locations?.join(', ') || 'Remote'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Work Mode</span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{selectedJobForDrawer.work_mode || 'Hybrid'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Education Eligibility</span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{selectedJobForDrawer.education_required?.join(', ') || 'Any Graduate'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Deadline</span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                    {selectedJobForDrawer.application_deadline
                      ? new Date(selectedJobForDrawer.application_deadline).toLocaleDateString()
                      : 'Rolling Applications'}
                  </span>
                </div>
              </div>

              {/* Walk-in Drive Details Card (when applicable) */}
              {selectedJobForDrawer.walk_in_details && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Official Walk-In Interview Instructions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-blue-800 pt-1">
                    <div>
                      <span className="font-semibold block text-[11px] text-blue-600">Interview Dates:</span>
                      <span>{selectedJobForDrawer.walk_in_details.dates}</span>
                    </div>
                    <div>
                      <span className="font-semibold block text-[11px] text-blue-600">Reporting Time:</span>
                      <span>{selectedJobForDrawer.walk_in_details.time}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold block text-[11px] text-blue-600">Venue Address:</span>
                    <span className="text-blue-900">{selectedJobForDrawer.walk_in_details.venue}</span>
                  </div>
                  {selectedJobForDrawer.walk_in_details.notes && (
                    <p className="text-[11px] text-blue-700 italic border-t border-blue-200 pt-1.5">
                      Note: {selectedJobForDrawer.walk_in_details.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Candidate Match Breakdown Card */}
              {selectedJobForDrawer.match && (
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Candidate Profile Match Score</span>
                    </div>
                    <span className="text-base font-extrabold text-indigo-700">
                      {selectedJobForDrawer.match.overall_match_score}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-400 block text-[10px]">Skills Match</span>
                      <span className="font-bold text-slate-800">{selectedJobForDrawer.match.skill_match_score}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-400 block text-[10px]">Experience</span>
                      <span className="font-bold text-slate-800">{selectedJobForDrawer.match.experience_match_score}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-slate-400 block text-[10px]">Education</span>
                      <span className="font-bold text-slate-800">{selectedJobForDrawer.match.education_match_score}%</span>
                    </div>
                  </div>

                  {selectedJobForDrawer.match.matched_skills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600">Matching Candidate Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedJobForDrawer.match.matched_skills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedJobForDrawer.match.missing_skills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600">Missing Skills for Role:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedJobForDrawer.match.missing_skills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                            - {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Portal Links */}
              {selectedJobForDrawer.sources && selectedJobForDrawer.sources.length > 1 && (
                <div className="space-y-2">
                  <span className="font-semibold text-slate-900 block">Available Across Multiple Portals:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedJobForDrawer.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-700 transition-colors"
                      >
                        <span className="font-medium">{s.platform}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Description & Responsibilities */}
              <div className="space-y-3">
                <span className="font-semibold text-slate-900 text-sm block">Job Description & Responsibilities</span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
                  {selectedJobForDrawer.description}
                </p>
              </div>

              {/* Requirements Checklist */}
              {selectedJobForDrawer.requirements && selectedJobForDrawer.requirements.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-900 text-sm block">Key Requirements</span>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {selectedJobForDrawer.requirements.map((req, idx) => (
                      <li key={idx} className="leading-snug">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Application Tracking Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Send className="w-4 h-4 text-indigo-600" />
                  <span>Personal Application Tracker</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Application Stage
                    </label>
                    <select
                      value={applicationStatus}
                      onChange={(e) => setApplicationStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="saved">Shortlisted / Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interview Scheduled</option>
                      <option value="offered">Offer Received</option>
                      <option value="rejected">Rejected / Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Recruiter / Interview Notes
                    </label>
                    <input
                      type="text"
                      value={applicationNotes}
                      onChange={(e) => setApplicationNotes(e.target.value)}
                      placeholder="e.g. HR call on Friday, tech test passed"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    trackApplicationMutation.mutate({
                      jobId: selectedJobForDrawer.id,
                      status: applicationStatus,
                      notes: applicationNotes,
                    })
                  }
                  disabled={trackApplicationMutation.isPending}
                  className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                >
                  {trackApplicationMutation.isPending ? 'Saving Status...' : 'Update Application Status & Notes'}
                </button>
              </div>

              {/* Similar Roles Strip */}
              {similarJobs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-900 text-xs block">Similar Active Openings:</span>
                  <div className="space-y-2">
                    {similarJobs.map((simJob) => (
                      <div
                        key={simJob.id}
                        onClick={() => setSelectedJobForDrawer(simJob)}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-100/60 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <h4 className="font-semibold text-slate-900 truncate text-xs">{simJob.title}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{simJob.company} • {simJob.salary}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. Save Search Modal */}
      {showSaveSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Save Search Criteria</h3>
              <button
                type="button"
                onClick={() => setShowSaveSearchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Save your current keyword and filter combination to easily re-run it in the future.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Search Bookmark Name</label>
              <input
                type="text"
                value={savedSearchName}
                onChange={(e) => setSavedSearchName(e.target.value)}
                placeholder="e.g. Fresher Java Delhi NCR"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveSearchModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveSearchToStorage(savedSearchName || 'My Job Search')}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Custom Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Custom Opportunity</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Junior Full Stack Developer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={newJob.company}
                  onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                  placeholder="e.g. Infosys, TCS, Startup"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application URL *</label>
                <input
                  type="url"
                  value={newJob.application_url}
                  onChange={(e) => setNewJob({ ...newJob, application_url: e.target.value })}
                  placeholder="https://company.com/careers/job-123"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Locations</label>
                  <input
                    type="text"
                    value={newJob.locations}
                    onChange={(e) => setNewJob({ ...newJob, locations: e.target.value })}
                    placeholder="Noida, Delhi NCR"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    placeholder="₹5,00,000 - ₹8,00,000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Education</label>
                  <input
                    type="text"
                    value={newJob.education_required}
                    onChange={(e) => setNewJob({ ...newJob, education_required: e.target.value })}
                    placeholder="BCA, B.Tech, MCA"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recruitment Type</label>
                  <select
                    value={newJob.recruitment_type}
                    onChange={(e) => setNewJob({ ...newJob, recruitment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="regular">Regular Hiring</option>
                    <option value="bulk_hiring">Bulk Hiring Drive</option>
                    <option value="walk_in">Walk-in Interview</option>
                    <option value="fresher_drive">Fresher Off-Campus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={newJob.skills}
                  onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                  placeholder="Java, Spring Boot, React, MySQL"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Responsibilities, requirements, and role details..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => addJobMutation.mutate()}
                disabled={!newJob.title || !newJob.company || !newJob.application_url || addJobMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                {addJobMutation.isPending ? 'Adding Job...' : 'Save Opportunity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
