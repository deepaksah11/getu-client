import {
  Application,
  AutomationError,
  AutomationRun,
  AutomationStep,
  CandidateProfile,
  DashboardStats,
  AnalyticsData,
  MasterResume,
  NormalizedJob,
  ResumeVersion,
  UserPreferences,
  UserCandidate,
  PlatformInfo,
  PlatformBoards,
  AnswerBankEntry,
  Readiness,
  RunProgress,
  PlatformRunSummary,
} from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getActiveUserId(): string {
  try {
    return localStorage.getItem('ai_job_user_id') || '00000000-0000-0000-0000-000000000001';
  } catch {
    return '00000000-0000-0000-0000-000000000001';
  }
}

export function setActiveUserId(userId: string): void {
  try {
    localStorage.setItem('ai_job_user_id', userId);
  } catch {}
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const activeUserId = getActiveUserId();
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': activeUserId,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.error) errMessage = errData.error;
    } catch (_) {}
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // --- Jobs ---
  async getJobs(params?: { keyword?: string; location?: string; work_mode?: string }) {
    const query = new URLSearchParams();
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.location) query.set('location', params.location);
    if (params?.work_mode) query.set('work_mode', params.work_mode);
    return fetchJson<{ success: boolean; data: NormalizedJob[]; pagination: any }>(
      `/api/jobs?${query.toString()}`
    );
  },

  async getJob(id: string) {
    return fetchJson<{ success: boolean; data: NormalizedJob & { application?: Application | null } }>(
      `/api/jobs/${id}`
    );
  },

  async scanJobs(platforms?: string[]) {
    return fetchJson<{
      success: boolean;
      scanned: number;
      results: { platform: string; found: number; error?: string; skipped?: string }[];
      message: string;
    }>('/api/jobs/scan', {
      method: 'POST',
      body: JSON.stringify({ platforms }),
    });
  },

  async analyzeJob(id: string) {
    return fetchJson<{ success: boolean; data: NormalizedJob; analysis: any }>(
      `/api/jobs/${id}/analyze`,
      { method: 'POST' }
    );
  },

  // --- Resumes ---
  async getMasterResume() {
    return fetchJson<{ success: boolean; data: MasterResume }>('/api/resumes/master');
  },

  async updateMasterResume(content_json: any) {
    return fetchJson<{ success: boolean; data: MasterResume }>('/api/resumes/master', {
      method: 'PUT',
      body: JSON.stringify({ content_json }),
    });
  },

  async getResumeVersions(jobId?: string) {
    const q = jobId ? `?job_id=${jobId}` : '';
    return fetchJson<{ success: boolean; data: ResumeVersion[] }>(`/api/resumes/versions${q}`);
  },

  async getResumeVersion(id: string) {
    return fetchJson<{ success: boolean; data: ResumeVersion }>(`/api/resumes/versions/${id}`);
  },

  async generateResume(jobId: string, templateId: string = 'ats_classic') {
    return fetchJson<{ success: boolean; data: ResumeVersion }>('/api/resumes/generate', {
      method: 'POST',
      body: JSON.stringify({ jobId, templateId }),
    });
  },

  async deleteResumeVersion(id: string) {
    return fetchJson<{ success: boolean }>(`/api/resumes/versions/${id}`, { method: 'DELETE' });
  },

  getResumeDownloadUrl(id: string, format: 'pdf' | 'docx') {
    return `${API_BASE}/api/resumes/download/${id}/${format}`;
  },

  // --- Applications ---
  async getApplications(status?: string) {
    const q = status ? `?status=${status}` : '';
    return fetchJson<{ success: boolean; data: Application[]; pagination: any }>(
      `/api/applications${q}`
    );
  },

  async getApplication(id: string) {
    return fetchJson<{ success: boolean; data: Application }>(`/api/applications/${id}`);
  },

  async applyJob(jobId: string, forceProduction: boolean = false) {
    return fetchJson<{ success: boolean; status: string; message: string; application?: Application }>(
      `/api/applications/apply/${jobId}`,
      {
        method: 'POST',
        body: JSON.stringify({ forceProduction }),
      }
    );
  },

  async retryApplication(id: string, forceProduction: boolean = false) {
    return fetchJson<{ success: boolean; status: string; message: string; application?: Application }>(
      `/api/applications/${id}/retry`,
      {
        method: 'POST',
        body: JSON.stringify({ forceProduction }),
      }
    );
  },

  async markApplicationSubmitted(id: string) {
    return fetchJson<{ success: boolean; application: Application }>(`/api/applications/${id}/mark-submitted`, {
      method: 'POST',
    });
  },

  // --- Platforms & logins ---
  async getPlatforms() {
    return fetchJson<{ success: boolean; data: PlatformInfo[]; enabled_platforms: string[]; boards: PlatformBoards }>('/api/platforms');
  },

  async setEnabledPlatforms(enabled_platforms: string[]) {
    return fetchJson<{ success: boolean; data: string[] }>('/api/platforms/enabled', {
      method: 'PUT',
      body: JSON.stringify({ enabled_platforms }),
    });
  },

  async saveCredentials(platformId: string, username: string, password?: string) {
    return fetchJson<{ success: boolean; data: PlatformInfo }>(`/api/platforms/${encodeURIComponent(platformId)}/credentials`, {
      method: 'PUT',
      body: JSON.stringify({ username, password: password || undefined }),
    });
  },

  async removeCredentials(platformId: string) {
    return fetchJson<{ success: boolean }>(`/api/platforms/${encodeURIComponent(platformId)}/credentials`, { method: 'DELETE' });
  },

  async connectPlatform(platformId: string, interactive = true) {
    return fetchJson<{ success: boolean; data: PlatformInfo }>(`/api/platforms/${encodeURIComponent(platformId)}/connect`, {
      method: 'POST',
      body: JSON.stringify({ interactive }),
    });
  },

  async saveBoards(boards: Partial<PlatformBoards>) {
    return fetchJson<{ success: boolean; data: PlatformBoards }>('/api/platforms/boards', {
      method: 'PUT',
      body: JSON.stringify(boards),
    });
  },

  // --- Screening answers ---
  async getAnswers() {
    return fetchJson<{ success: boolean; data: AnswerBankEntry[]; pending: number }>('/api/answers');
  },

  async saveAnswer(id: string, answer: string) {
    return fetchJson<{ success: boolean; data: AnswerBankEntry }>(`/api/answers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ answer }),
    });
  },

  async addAnswer(question: string, answer: string) {
    return fetchJson<{ success: boolean; data: AnswerBankEntry }>('/api/answers', {
      method: 'POST',
      body: JSON.stringify({ question, answer }),
    });
  },

  async deleteAnswer(id: string) {
    return fetchJson<{ success: boolean }>(`/api/answers/${id}`, { method: 'DELETE' });
  },

  getFileUrl(path?: string) {
    return path ? `${API_BASE}${path}` : undefined;
  },

  // --- Candidate Profile ---
  async getProfile() {
    return fetchJson<{ success: boolean; data: CandidateProfile }>('/api/profile');
  },

  async updateProfile(profile: Partial<CandidateProfile>) {
    return fetchJson<{ success: boolean; data: CandidateProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  // --- Automation ---
  async getAutomationStatus() {
    return fetchJson<{
      success: boolean;
      data: {
        enabled: boolean;
        mode: 'dry-run' | 'production';
        intervalMins: number;
        isRunning: boolean;
        activeRunId?: string;
        lastRunAt?: string;
        nextRunAt?: string;
        latestRun: {
          id: string;
          status: AutomationRun['status'];
          progress?: RunProgress;
          platforms?: Record<string, PlatformRunSummary>;
          started_at: string;
          ended_at?: string;
          error_message?: string;
          jobs_scanned: number;
          applications_submitted: number;
          human_verification_required: number;
          applications_failed: number;
        } | null;
        stats: any;
      };
    }>('/api/automation/status');
  },

  async getReadiness() {
    return fetchJson<{ success: boolean; data: Readiness }>('/api/automation/readiness');
  },

  async stopAutomation() {
    return fetchJson<{ success: boolean; message: string }>('/api/automation/stop', { method: 'POST' });
  },

  async startAutomation() {
    return fetchJson<{ success: boolean; message: string }>('/api/automation/start', {
      method: 'POST',
    });
  },

  async pauseAutomation() {
    return fetchJson<{ success: boolean; message: string }>('/api/automation/pause', {
      method: 'POST',
    });
  },

  async resumeAutomation() {
    return fetchJson<{ success: boolean; message: string }>('/api/automation/resume', {
      method: 'POST',
    });
  },

  async runNow(options?: { dryRun?: boolean; platforms?: string[] }) {
    return fetchJson<{ success: boolean; data: { runId: string }; message: string }>('/api/automation/run-now', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  async getRuns() {
    return fetchJson<{ success: boolean; data: AutomationRun[] }>('/api/automation/runs');
  },

  async getSteps(params?: { runId?: string; applicationId?: string }) {
    const q = new URLSearchParams();
    if (params?.runId) q.set('runId', params.runId);
    if (params?.applicationId) q.set('applicationId', params.applicationId);
    return fetchJson<{ success: boolean; data: AutomationStep[] }>(`/api/automation/steps?${q.toString()}`);
  },

  async getErrors(runId?: string) {
    const q = runId ? `?runId=${runId}` : '';
    return fetchJson<{ success: boolean; data: AutomationError[] }>(`/api/automation/errors${q}`);
  },

  async resolveError(id: string) {
    return fetchJson<{ success: boolean }>(`/api/automation/errors/${id}/resolve`, {
      method: 'POST',
    });
  },

  // --- Analytics & Dashboard ---
  async getDashboardStats() {
    return fetchJson<{ success: boolean; data: DashboardStats }>('/api/analytics/dashboard');
  },

  async getAnalytics() {
    return fetchJson<{ success: boolean; data: AnalyticsData }>('/api/analytics');
  },

  // --- Settings ---
  async getSettings() {
    return fetchJson<{ success: boolean; data: UserPreferences }>('/api/settings');
  },

  async updateSettings(settings: Partial<UserPreferences>) {
    return fetchJson<{ success: boolean; data: UserPreferences }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // --- Resume Extractor & Profile AI ---
  async extractResume(input: File | string, autoSave: boolean = false) {
    if (typeof input === 'string') {
      return fetchJson<{
        success: boolean;
        data: any;
        profile?: CandidateProfile;
        applied: boolean;
        message: string;
      }>('/api/profile/extract-resume', {
        method: 'POST',
        body: JSON.stringify({ text: input, autoSave }),
      });
    } else {
      const formData = new FormData();
      formData.append('resume', input);
      if (autoSave) formData.append('autoSave', 'true');
      const res = await fetch(`${API_BASE}/api/profile/extract-resume`, {
        method: 'POST',
        headers: {
          'x-user-id': getActiveUserId(),
        },
        body: formData,
      });
      if (!res.ok) {
        let errMessage = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch (_) {}
        throw new Error(errMessage);
      }
      return res.json();
    }
  },

  async applyExtractedProfile(extracted: any) {
    return fetchJson<{ success: boolean; data: CandidateProfile; message: string }>(
      '/api/profile/apply-extracted',
      {
        method: 'POST',
        body: JSON.stringify(extracted),
      }
    );
  },

  // --- Users & Multiple Candidate Profiles ---
  async getUsers() {
    return fetchJson<{ success: boolean; data: UserCandidate[]; active_user_id: string }>(
      '/api/users'
    );
  },

  async getCurrentUser() {
    return fetchJson<{
      success: boolean;
      data: { id: string; email: string; full_name: string; profile: CandidateProfile };
    }>('/api/users/current');
  },

  async createUser(data: { email: string; full_name?: string }) {
    return fetchJson<{
      success: boolean;
      data: { user: any; profile: CandidateProfile };
      message: string;
    }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- Data Management & Custom Jobs ---
  async clearData(keepJobs: boolean = true) {
    return fetchJson<{ success: boolean; message: string }>('/api/settings/clear-data', {
      method: 'POST',
      body: JSON.stringify({ keepJobs }),
    });
  },

  async addJob(job: {
    title: string;
    company: string;
    application_url: string;
    description?: string;
    skills?: string[];
    locations?: string[];
    work_mode?: string;
    salary?: string;
    experience_required?: string;
    platform?: string;
  }) {
    return fetchJson<{ success: boolean; data: NormalizedJob; message: string }>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    });
  },
};
