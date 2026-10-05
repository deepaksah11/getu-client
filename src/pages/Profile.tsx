import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { CardSkeleton } from '../components/Skeleton.js';
import { useAppStore } from '../store/index.js';
import { UserCheck, Save, Sparkles, Plus, Users, UserPlus, Target, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CandidateProfile } from '../types/index.js';
import { ScreeningAnswers } from '../components/ScreeningAnswers.js';
import { ResumeExtractor } from '../components/ResumeExtractor.js';
import { ExperienceEditor, EducationEditor, ProjectsEditor, LinesEditor, toList, fromList } from '../components/ProfileEditors.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fields the user edits; ids and timestamps are managed by the server. */
function toPayload(form: Partial<CandidateProfile>): Partial<CandidateProfile> {
  const { id: _id, user_id: _uid, created_at: _c, updated_at: _u, ...rest } = form as CandidateProfile & { created_at?: string; updated_at?: string };
  // An empty gender clears a previously saved value ("Prefer not to say")
  return { ...rest, gender: rest.gender ?? '' };
}

function validate(form: Partial<CandidateProfile>): string | null {
  if (!form.full_name?.trim()) return 'Full name is required.';
  if (form.email?.trim() && !EMAIL.test(form.email.trim())) return 'Enter a valid email address.';
  const badExp = (form.experience || []).findIndex((e) => (e.company?.trim() || e.role?.trim()) && !(e.company?.trim() && e.role?.trim()));
  if (badExp >= 0) return `Work experience #${badExp + 1}: enter both the job title and the company.`;
  const badEdu = (form.education || []).findIndex((e) => (e.degree?.trim() || e.field_of_study?.trim()) && !e.institution?.trim());
  if (badEdu >= 0) return `Education #${badEdu + 1}: enter the college or university.`;
  const badProject = (form.projects || []).findIndex((p) => (p.description?.trim() || p.url?.trim()) && !p.title?.trim());
  if (badProject >= 0) return `Project #${badProject + 1}: enter a project name.`;
  return null;
}

export const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast, activeUserId, setActiveUserId, openUserModal } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ['candidate-profile', activeUserId],
    queryFn: () => api.getProfile(),
    // A background refetch must never replace what the user is typing
    refetchOnWindowFocus: false,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.getUsers(),
  });

  const [form, setForm] = useState<Partial<CandidateProfile>>({});
  const [dirty, setDirty] = useState(false);
  const loadedFor = useRef<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateEmail, setNewCandidateEmail] = useState('');

  // Load server data into the form when the page opens, the candidate changes, or there are no unsaved edits
  useEffect(() => {
    if (!data?.data) return;
    if (!dirty || loadedFor.current !== activeUserId) {
      setForm(data.data);
      setDirty(false);
      loadedFor.current = activeUserId;
    }
  }, [data, activeUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before closing or reloading the tab with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const patch = (changes: Partial<CandidateProfile>) => {
    setForm((current) => ({ ...current, ...changes }));
    setDirty(true);
  };

  const discardChanges = () => {
    if (data?.data) setForm(data.data);
    setDirty(false);
  };

  const createCandidateMutation = useMutation({
    mutationFn: (payload: { email: string; full_name: string }) => api.createUser(payload),
    onSuccess: (res) => {
      addToast({
        type: 'success',
        title: 'New Candidate Profile Created',
        message: `Profile for "${res.data.profile.full_name}" is active. Fill it in below or upload a resume.`,
      });
      setDirty(false);
      setActiveUserId(res.data.user.id);
      queryClient.invalidateQueries();
      setNewCandidateName('');
      setNewCandidateEmail('');
      setQuickAddOpen(false);
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Failed creating candidate', message: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updated: Partial<CandidateProfile>) => api.updateProfile(updated),
    onSuccess: (res) => {
      // Show exactly what the server stored (empty rows removed, values normalised)
      setForm(res.data);
      setDirty(false);
      queryClient.setQueryData(['candidate-profile', activeUserId], res);
      addToast({ type: 'success', title: 'Profile saved', message: 'Your profile and master resume are updated.' });
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      queryClient.invalidateQueries({ queryKey: ['current-user', activeUserId] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['master-resume'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err: any) => {
      addToast({ type: 'error', title: 'Save failed', message: err.message });
    },
  });

  const save = () => {
    const problem = validate(form);
    if (problem) {
      addToast({ type: 'error', title: 'Check your profile', message: problem });
      return;
    }
    updateMutation.mutate(toPayload(form));
  };

  if (isLoading) return <CardSkeleton />;

  const candidateUsers = usersData?.data || [];

  return (
    <div className={`space-y-6 animate-in fade-in duration-200 ${dirty ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Candidate Profile</h1>
            {dirty ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Unsaved changes</span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload a resume or fill this in by hand. Tailored resumes and application answers use only what is here.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => openUserModal('create')} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5" title="Create a new candidate profile">
            <UserPlus className="w-3.5 h-3.5 text-brand-600" />
            <span>+ New User Profile</span>
          </button>

          <button onClick={save} disabled={updateMutation.isPending || !dirty} className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shadow-sm">
            <Save className="w-3.5 h-3.5" />
            <span>{updateMutation.isPending ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* Candidate Profile Switcher Bar */}
      <div className="card p-4 bg-gradient-to-r from-brand-50/50 via-white to-slate-50 border-brand-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-sm shadow-xs uppercase">
            {form.full_name ? form.full_name.charAt(0) : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Active Profile: {form.full_name || 'Anonymous Candidate'}</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Email: <strong className="text-slate-700">{form.email || 'Not specified'}</strong> &bull; Total Skills:{' '}
              <strong className="text-slate-700">{form.skills?.length || 0}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-semibold text-slate-600 shrink-0">Switch Candidate:</label>
          <select
            value={activeUserId}
            onChange={(e) => {
              if (dirty && !window.confirm('You have unsaved profile changes. Switch candidate and discard them?')) return;
              setDirty(false);
              setActiveUserId(e.target.value);
              queryClient.invalidateQueries();
              addToast({ type: 'info', message: 'Switched active candidate profile.' });
            }}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {candidateUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.email})
              </option>
            ))}
          </select>

          <button onClick={() => setQuickAddOpen(!quickAddOpen)} className="btn-primary py-1.5 px-2.5 text-xs flex items-center gap-1 shrink-0" title="Register a new user candidate">
            <Plus className="w-3.5 h-3.5" />
            <span>{quickAddOpen ? 'Close Form' : 'Add Candidate'}</span>
          </button>

          <button onClick={() => openUserModal('list')} className="btn-secondary py-1.5 px-2 text-xs flex items-center gap-1 shrink-0" title="Manage all candidate accounts">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">All ({candidateUsers.length})</span>
          </button>
        </div>
      </div>

      {/* Inline Quick Candidate Creation Card */}
      {quickAddOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!EMAIL.test(newCandidateEmail.trim())) {
              addToast({ type: 'error', message: 'Please provide a valid email address.' });
              return;
            }
            if (!newCandidateName.trim()) {
              addToast({ type: 'error', message: 'Candidate full name is required.' });
              return;
            }
            if (dirty && !window.confirm('You have unsaved profile changes. Create a new candidate and discard them?')) return;
            createCandidateMutation.mutate({ email: newCandidateEmail.trim(), full_name: newCandidateName.trim() });
          }}
          className="card p-5 bg-gradient-to-br from-brand-50/80 via-white to-slate-50 border-brand-300 ring-2 ring-brand-500/20 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-brand-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Add New Candidate Profile</h3>
                <p className="text-[11px] text-slate-500">Creates an isolated candidate profile with separate resumes and preferences</p>
              </div>
            </div>
            <button type="button" onClick={() => setQuickAddOpen(false)} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Candidate Full Name <span className="text-rose-500">*</span>
              </label>
              <input type="text" required autoFocus placeholder="e.g. Maya Lin" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} className="input-text text-xs" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input type="email" required placeholder="e.g. maya.lin@gmail.com" value={newCandidateEmail} onChange={(e) => setNewCandidateEmail(e.target.value)} className="input-text text-xs" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-brand-100">
            <span className="text-[11px] text-slate-500">The new profile will be activated and ready for resume upload or manual entry.</span>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button type="button" onClick={() => setQuickAddOpen(false)} className="btn-secondary py-1.5 px-3 text-xs">
                Cancel
              </button>
              <button type="submit" disabled={createCandidateMutation.isPending} className="btn-primary py-1.5 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{createCandidateMutation.isPending ? 'Creating...' : 'Create & Activate Candidate'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Resume upload: when its data is applied, reload the form from the server */}
      <ResumeExtractor onSuccess={() => setDirty(false)} />

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand-600" />
            Basic Personal & Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input type="text" value={form.full_name || ''} onChange={(e) => patch({ full_name: e.target.value })} className="input-text" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input type="email" value={form.email || ''} onChange={(e) => patch({ email: e.target.value })} className="input-text" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
              <input type="tel" value={form.phone || ''} placeholder="+91 98765 43210" onChange={(e) => patch({ phone: e.target.value })} className="input-text" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
              <input type="text" value={form.location || ''} placeholder="City, State, Country" onChange={(e) => patch({ location: e.target.value })} className="input-text" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Summary</label>
            <textarea rows={3} value={form.professional_summary || ''} onChange={(e) => patch({ professional_summary: e.target.value })} className="input-text leading-relaxed" />
          </div>
        </div>

        {/* Career expectations and targets */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-600" />
            Career Expectations & Targets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={form.years_of_experience ?? 0}
                onChange={(e) => patch({ years_of_experience: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="input-text"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Period (Days)</label>
              <input
                type="number"
                min={0}
                value={form.notice_period_days ?? 0}
                onChange={(e) => patch({ notice_period_days: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="input-text"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Salary / CTC</label>
              <input type="text" value={form.salary_expectation || ''} placeholder="e.g. 18 LPA" onChange={(e) => patch({ salary_expectation: e.target.value })} className="input-text" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Mode Preference</label>
              <input type="text" value={form.work_mode_preference || ''} placeholder="e.g. Remote or Hybrid" onChange={(e) => patch({ work_mode_preference: e.target.value })} className="input-text" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target roles (comma-separated)</label>
              <input type="text" value={fromList(form.preferred_roles)} placeholder="e.g. React Developer, Frontend Engineer" onChange={(e) => patch({ preferred_roles: toList(e.target.value) })} className="input-text" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred locations (comma-separated)</label>
              <input type="text" value={fromList(form.preferred_locations)} placeholder="e.g. Bengaluru, Pune, Remote" onChange={(e) => patch({ preferred_locations: toList(e.target.value) })} className="input-text" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Languages (comma-separated)</label>
              <input type="text" value={fromList(form.languages)} placeholder="e.g. English, Hindi" onChange={(e) => patch({ languages: toList(e.target.value) })} className="input-text" />
            </div>
          </div>
        </div>

        {/* Facts that application forms ask for */}
        <div className="card p-6 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-sm font-semibold text-slate-900">Application Details</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Used to fill application forms. Anything left empty is asked once and remembered, never guessed.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(
              [
                ['linkedin_url', 'LinkedIn URL', 'https://linkedin.com/in/…'],
                ['github_url', 'GitHub URL', 'https://github.com/…'],
                ['portfolio_url', 'Portfolio / Website', 'https://…'],
                ['current_ctc', 'Current CTC / Salary', 'e.g. 12 LPA'],
              ] as const
            ).map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
                <input type="text" value={(form[key] as string) || ''} placeholder={placeholder} onChange={(e) => patch({ [key]: e.target.value })} className="input-text" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender (optional)</label>
              <select value={form.gender || ''} onChange={(e) => patch({ gender: e.target.value || undefined })} className="input-text">
                <option value="">Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                ['work_authorized', 'Authorized to work in my country', true],
                ['requires_sponsorship', 'I need visa sponsorship', false],
                ['willing_to_relocate', 'Willing to relocate', false],
              ] as const
            ).map(([key, label, fallback]) => (
              <label key={key} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={(form[key] as boolean | undefined) ?? fallback} onChange={(e) => patch({ [key]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-semibold text-slate-900">Skills ({form.skills?.length || 0})</h2>
          </div>

          <p className="text-[11px] text-slate-500">
            Years per skill answer "how many years of experience with X" questions. A skill that is not listed here is never claimed.
          </p>
          <div className="flex flex-wrap gap-2">
            {form.skills?.map((s, i) => (
              <span key={`${s.name}-${i}`} className="pl-2.5 pr-1 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5">
                <span>{s.name}</span>
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={0.5}
                  aria-label={`Years of experience with ${s.name}`}
                  value={s.years_experience}
                  onChange={(e) => {
                    const skills = [...(form.skills || [])];
                    skills[i] = { ...skills[i], years_experience: Math.max(0, parseFloat(e.target.value) || 0) };
                    patch({ skills });
                  }}
                  className="w-12 px-1 py-0.5 text-[11px] font-mono rounded border border-slate-300 bg-white"
                />
                <span className="text-[10px] text-slate-400">y</span>
                <button
                  type="button"
                  aria-label={`Remove ${s.name}`}
                  className="text-slate-400 hover:text-rose-600 px-1"
                  onClick={() => patch({ skills: (form.skills || []).filter((_, j) => j !== i) })}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <form
            className="flex gap-2 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('newSkill') as HTMLInputElement;
              const names = input.value.split(',').map((n) => n.trim()).filter(Boolean);
              const existing = new Set((form.skills || []).map((s) => s.name.toLowerCase()));
              const added = names.filter((n) => !existing.has(n.toLowerCase()));
              if (added.length === 0) return;
              patch({
                skills: [
                  ...(form.skills || []),
                  ...added.map((name) => ({ name, category: 'Technical' as const, proficiency: 'Intermediate' as const, years_experience: 1 })),
                ],
              });
              input.value = '';
            }}
          >
            <input name="newSkill" className="input-text py-1.5 text-xs" placeholder="Add skills, comma-separated (e.g. Python, SQL)" />
            <button type="submit" className="btn-secondary py-1.5 px-3 text-xs">
              Add
            </button>
          </form>
        </div>

        <ExperienceEditor value={form.experience || []} onChange={(experience) => patch({ experience })} />
        <ProjectsEditor value={form.projects || []} onChange={(projects) => patch({ projects })} />
        <EducationEditor value={form.education || []} onChange={(education) => patch({ education })} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LinesEditor
            title="Certifications"
            hint="One per line."
            value={form.certifications || []}
            placeholder="AWS Certified Cloud Practitioner"
            onChange={(certifications) => patch({ certifications })}
          />
          <LinesEditor
            title="Achievements & Honors"
            hint="One per line."
            value={form.achievements || []}
            placeholder="Winner, Smart India Hackathon 2023"
            onChange={(achievements) => patch({ achievements })}
          />
        </div>
      </div>

      <ScreeningAnswers />

      {/* Sticky save bar while there are unsaved edits */}
      {dirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(640px,calc(100%-2rem))] card px-4 py-3 bg-slate-900 text-white border-slate-800 shadow-lg flex items-center justify-between gap-3">
          <span className="text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" /> You have unsaved profile changes
          </span>
          <div className="flex items-center gap-2">
            <button onClick={discardChanges} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Discard
            </button>
            <button onClick={save} disabled={updateMutation.isPending} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> {updateMutation.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
