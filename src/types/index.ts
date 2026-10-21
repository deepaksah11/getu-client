export type ApplicationStatus =
  | 'DISCOVERED'
  | 'ANALYZING'
  | 'MATCHED'
  | 'NOT_ELIGIBLE'
  | 'RESUME_GENERATING'
  | 'RESUME_READY'
  | 'APPLICATION_READY'
  | 'APPLYING'
  | 'SUBMITTED'
  | 'FAILED'
  | 'REQUIRES_HUMAN_ACTION'
  | 'DUPLICATE';

export interface UserPreferences {
  id: string;
  user_id: string;
  minimum_match_score: number;
  max_applications_per_day: number;
  preferred_roles: string[];
  preferred_locations: string[];
  work_modes: string[];
  excluded_companies: string[];
  excluded_keywords: string[];
  enabled_platforms?: string[];
  automation_enabled: boolean;
  automation_mode: 'dry-run' | 'production';
  schedule_interval_mins: number;
  search_keywords?: string[];
  search_locations?: string[];
  jobs_per_platform?: number;
  posted_within_days?: number;
  per_platform_daily_limit?: number;
  show_browser?: boolean;
  greenhouse_boards?: string[];
  lever_companies?: string[];
  ashby_boards?: string[];
  naukri_upload_tailored_resume?: boolean;
  last_run_at?: string;
}

export type PlatformConnectionStatus =
  | 'not_connected'
  | 'credentials_saved'
  | 'connecting'
  | 'awaiting_user'
  | 'connected'
  | 'needs_verification'
  | 'failed';

export interface PlatformInfo {
  id: string;
  name: string;
  description: string;
  notes?: string;
  requires_login: boolean;
  needs_visible_browser: boolean;
  can_search: boolean;
  enabled: boolean;
  connection: {
    status: PlatformConnectionStatus;
    username: string;
    has_password: boolean;
    has_session: boolean;
    last_verified_at?: string;
    last_error?: string;
  } | null;
}

export interface PlatformBoards {
  greenhouse_boards: string[];
  lever_companies: string[];
  ashby_boards: string[];
}

export interface AnswerBankEntry {
  id: string;
  question: string;
  answer?: string;
  field_type?: string;
  options?: string[];
  platform?: string;
  times_seen: number;
  created_at: string;
  updated_at: string;
}

export interface Readiness {
  ready: boolean;
  profile: { ready: boolean; missing: string[]; warnings: string[] };
  platforms: { id: string; name: string; ready: boolean; reason: string }[];
  search: { keywords: string[]; locations: string[]; limit: number; postedWithinDays: number };
  ai_engine: 'gemini' | 'offline';
  mode: 'dry-run' | 'production';
  pending_questions: number;
}

export interface RunProgress {
  phase: 'starting' | 'discovering' | 'matching' | 'applying' | 'finished';
  platform?: string;
  current_job?: string;
  message?: string;
  queue_total?: number;
  queue_done?: number;
}

export interface PlatformRunSummary {
  discovered: number;
  applied: number;
  failed: number;
  needs_action: number;
  skipped_reason?: string;
}

export interface CandidateSkill {
  id?: string;
  name: string;
  category: 'Technical' | 'Soft' | 'Tool' | 'Framework';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  years_experience: number;
}

export interface CandidateExperience {
  id?: string;
  company: string;
  role: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  bullets: string[];
  technologies: string[];
}

export interface CandidateProject {
  id?: string;
  title: string;
  description: string;
  role?: string;
  url?: string;
  technologies: string[];
  bullets: string[];
}

export interface CandidateEducation {
  id?: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number;
  end_year?: number;
  grade?: string;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  professional_summary: string;
  years_of_experience: number;
  notice_period_days: number;
  salary_expectation?: string;
  work_mode_preference: string;
  preferred_roles: string[];
  preferred_locations: string[];
  languages: string[];
  certifications: string[];
  achievements: string[];
  skills: CandidateSkill[];
  experience: CandidateExperience[];
  projects: CandidateProject[];
  education: CandidateEducation[];
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  current_ctc?: string;
  work_authorized?: boolean;
  requires_sponsorship?: boolean;
  willing_to_relocate?: boolean;
  gender?: string;
}

export interface MasterResumeContent {
  summary: string;
  skills: {
    category: string;
    items: string[];
  }[];
  experience: {
    company: string;
    role: string;
    period: string;
    location?: string;
    bullets: string[];
    technologies: string[];
  }[];
  projects: {
    title: string;
    description: string;
    bullets: string[];
    technologies: string[];
    link?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
    details?: string;
  }[];
  certifications: string[];
  achievements: string[];
}

export interface MasterResume {
  id: string;
  user_id: string;
  title: string;
  is_master: boolean;
  content_json: MasterResumeContent;
  created_at: string;
  updated_at: string;
}

export interface ResumeVersion {
  id: string;
  user_id: string;
  master_resume_id: string;
  job_id?: string;
  title: string;
  template_id: 'ats_classic' | 'modern_pro' | 'backend_dev';
  content_json: MasterResumeContent;
  ats_score: number;
  missing_keywords: string[];
  ats_feedback: {
    keyword_coverage: number;
    formatting_score: number;
    readability_score: number;
    issues: string[];
  };
  cover_letter?: string;
  pdf_path?: string;
  docx_path?: string;
  created_at: string;
  updated_at: string;
}

export type JobVerificationStatus = 'verified_live' | 'unverified' | 'checking' | 'expired' | 'closed';
export type RecruitmentType = 'regular' | 'bulk_hiring' | 'walk_in' | 'fresher_drive' | 'off_campus';
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'trainee';

export interface JobSourceLink {
  platform: string;
  url: string;
  is_verified?: boolean;
  posted_at?: string;
  direct_apply?: boolean;
}

export interface WalkInDetails {
  dates?: string;
  time?: string;
  venue?: string;
  contact_person?: string;
  notes?: string;
}

export interface NormalizedJob {
  id: string;
  external_id: string;
  platform: string;
  title: string;
  company: string;
  locations: string[];
  work_mode: string;
  experience_required: string;
  salary: string;
  description: string;
  requirements: string[];
  skills: string[];
  application_url: string;
  posted_at?: string;
  match?: JobMatch;
  created_at: string;

  // Live Job Search & Verification Enhancements
  company_logo?: string;
  education_required?: string[];
  min_experience_years?: number;
  max_experience_years?: number;
  min_salary?: number;
  max_salary?: number;
  salary_currency?: string;
  job_type?: JobType;
  recruitment_type?: RecruitmentType;
  is_bulk_hiring?: boolean;
  walk_in_details?: WalkInDetails;
  application_deadline?: string;
  verification_status?: JobVerificationStatus;
  last_verified_at?: string;
  verification_details?: {
    http_status?: number;
    checked_at?: string;
    message?: string;
    is_accessible?: boolean;
  };
  sources?: JobSourceLink[];
  is_bookmarked?: boolean;
  candidate_notes?: string;
  application_status?: ApplicationStatus;
  apply_mode?: 'direct_automated' | 'external_portal' | 'walk_in';
  industry?: string;
  company_size?: string;
}

export interface JobBookmark {
  id: string;
  user_id: string;
  job_id: string;
  notes?: string;
  created_at: string;
}

export interface LiveJobFilterOptions {
  keyword?: string;
  excluded_keywords?: string[];
  locations?: string[];
  location?: string;
  work_modes?: string[];
  work_mode?: string;
  experience_level?: 'fresher' | '0-1' | '1-2' | '2-3' | '3-5' | '5+' | 'all';
  min_experience?: number;
  max_experience?: number;
  min_salary?: number;
  max_salary?: number;
  salary_currency?: string;
  job_types?: string[];
  roles?: string[];
  technologies?: string[];
  education?: string[];
  company_name?: string;
  industry?: string;
  company_size?: string;
  recruitment_types?: string[];
  posted_within_days?: number;
  platforms?: string[];
  platform?: string;
  verification_status?: 'verified_live' | 'unverified' | 'all';
  only_freshers?: boolean;
  only_bulk_hiring?: boolean;
  only_bookmarked?: boolean;
  sort_by?: 'newest' | 'relevance' | 'salary_high' | 'experience_low' | 'deadline';
  limit?: number;
  offset?: number;
}

export interface JobMatch {
  id: string;
  user_id: string;
  job_id: string;
  overall_match_score: number;
  skill_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  location_match_score: number;
  title_match_score: number;
  is_eligible: boolean;
  eligibility_reason?: string;
  matched_skills: string[];
  missing_skills: string[];
  match_breakdown: {
    weights: Record<string, number>;
    details: Record<string, string>;
  };
}

export interface ApplicationQuestion {
  id: string;
  application_id: string;
  question_text: string;
  question_type: string;
  answer?: {
    id: string;
    answer_text: string;
    is_factual: boolean;
    source?: 'candidate_profile' | 'answer_bank' | 'ai' | 'rule';
  };
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  resume_version_id?: string;
  status: ApplicationStatus;
  failure_reason?: string;
  requires_human_reason?: string;
  applied_at?: string;
  platform?: string;
  attempt_count?: number;
  submission_verified?: boolean;
  screenshot_url?: string;
  unanswered_questions?: string[];
  submission_receipt?: {
    confirmation_number?: string;
    /** written by older versions */
    confirmationNumber?: string;
    timestamp?: string;
    message?: string;
    details?: string;
  };
  created_at: string;
  updated_at: string;
  job?: NormalizedJob;
  resume_version?: ResumeVersion;
  match?: JobMatch;
  timeline_steps?: AutomationStep[];
  questions?: ApplicationQuestion[];
}

export interface AutomationRun {
  id: string;
  trigger_type: 'manual' | 'scheduled' | 'api';
  mode: 'dry-run' | 'production';
  status: 'running' | 'completed' | 'paused' | 'failed' | 'cancelled';
  progress?: RunProgress;
  platforms?: Record<string, PlatformRunSummary>;
  jobs_scanned: number;
  jobs_matched: number;
  applications_submitted: number;
  applications_failed: number;
  human_verification_required: number;
  started_at: string;
  ended_at?: string;
  error_message?: string;
}

export interface AutomationStep {
  id: string;
  run_id: string;
  job_id?: string;
  application_id?: string;
  step_name: string;
  status: 'success' | 'warning' | 'failed' | 'paused';
  details: Record<string, any>;
  duration_ms: number;
  created_at: string;
}

export interface AutomationError {
  id: string;
  run_id?: string;
  application_id?: string;
  error_type: string;
  message: string;
  stack?: string;
  resolved: boolean;
  created_at: string;
}

export interface DashboardStats {
  jobs_found: number;
  matched: number;
  applied: number;
  failed: number;
  needs_attention: number;
  resumes_generated: number;
  automation_status: 'RUNNING' | 'PAUSED' | 'IDLE' | 'FAILED';
  automation_mode: 'dry-run' | 'production';
  recent_jobs: NormalizedJob[];
  recent_applications: Application[];
}

export interface AnalyticsData {
  jobs_over_time: { date: string; count: number }[];
  applications_over_time: { date: string; submitted: number; failed: number }[];
  match_distribution: { range: string; count: number }[];
  applications_by_role: { role: string; count: number }[];
  top_skills: { skill: string; count: number }[];
  failure_reasons: { reason: string; count: number }[];
}

export interface UserCandidate {
  id: string;
  email: string;
  full_name: string;
  headline?: string;
  skills_count: number;
  is_active: boolean;
  created_at: string;
}
