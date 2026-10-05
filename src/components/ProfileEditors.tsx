import React from 'react';
import { Plus, Trash2, Briefcase, GraduationCap, FolderGit2, Award } from 'lucide-react';
import { CandidateEducation, CandidateExperience, CandidateProject } from '../types/index.js';

/**
 * Comma / line lists are kept "raw" while typing (empty items are allowed) so a
 * trailing comma or newline is not swallowed mid-edit; the server drops empties on save.
 */
export const toList = (value: string): string[] => (value === '' ? [] : value.split(/\s*,\s*/));
export const fromList = (list?: string[]): string => (list || []).join(', ');
export const toLines = (value: string): string[] => (value === '' ? [] : value.split('\n'));
export const fromLines = (list?: string[]): string => (list || []).join('\n');

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
    {children}
  </label>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; count: number; addLabel: string; onAdd: () => void }> = ({
  icon,
  title,
  count,
  addLabel,
  onAdd,
}) => (
  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
      {icon}
      {title} ({count})
    </h2>
    <button type="button" onClick={onAdd} className="btn-secondary py-1.5 px-3 text-xs">
      <Plus className="w-3.5 h-3.5" /> {addLabel}
    </button>
  </div>
);

const RemoveButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button type="button" onClick={onClick} className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-medium" aria-label={label}>
    <Trash2 className="w-3.5 h-3.5" /> Remove
  </button>
);

function replaceAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export const ExperienceEditor: React.FC<{ value: CandidateExperience[]; onChange: (next: CandidateExperience[]) => void }> = ({ value, onChange }) => (
  <div className="card p-6 space-y-4">
    <SectionHeader
      icon={<Briefcase className="w-4 h-4 text-brand-600" />}
      title="Work Experience"
      count={value.length}
      addLabel="Add experience"
      onAdd={() => onChange([...value, { company: '', role: '', location: '', start_date: '', end_date: '', is_current: false, bullets: [], technologies: [] }])}
    />
    {value.length === 0 && <p className="text-xs text-slate-500">No work experience yet. Add your jobs or internships; they are used in every tailored resume.</p>}
    {value.map((exp, i) => (
      <div key={exp.id || i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Job title *">
            <input className="input-text" value={exp.role} placeholder="e.g. Software Engineer" onChange={(e) => onChange(replaceAt(value, i, { role: e.target.value }))} />
          </Field>
          <Field label="Company *">
            <input className="input-text" value={exp.company} placeholder="e.g. Infosys" onChange={(e) => onChange(replaceAt(value, i, { company: e.target.value }))} />
          </Field>
          <Field label="Location">
            <input className="input-text" value={exp.location || ''} placeholder="e.g. Bengaluru" onChange={(e) => onChange(replaceAt(value, i, { location: e.target.value }))} />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <Field label="Start (YYYY-MM)">
            <input className="input-text" value={exp.start_date} placeholder="e.g. 2022-03" onChange={(e) => onChange(replaceAt(value, i, { start_date: e.target.value }))} />
          </Field>
          <Field label="End (YYYY-MM)">
            <input
              className="input-text disabled:bg-slate-100 disabled:text-slate-400"
              value={exp.is_current ? '' : exp.end_date || ''}
              placeholder={exp.is_current ? 'Present' : 'e.g. 2024-06'}
              disabled={exp.is_current}
              onChange={(e) => onChange(replaceAt(value, i, { end_date: e.target.value }))}
            />
          </Field>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 pb-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-brand-600"
              checked={exp.is_current}
              onChange={(e) => onChange(replaceAt(value, i, { is_current: e.target.checked, end_date: e.target.checked ? '' : exp.end_date }))}
            />
            I currently work here
          </label>
        </div>
        <Field label="What you did and achieved (one point per line)">
          <textarea
            rows={4}
            className="input-text leading-relaxed"
            value={fromLines(exp.bullets)}
            placeholder={'Built REST APIs in Node.js used by 20 internal teams\nReduced page load time by 40% by ...'}
            onChange={(e) => onChange(replaceAt(value, i, { bullets: toLines(e.target.value) }))}
          />
        </Field>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <Field label="Technologies used (comma-separated)" className="flex-1">
            <input
              className="input-text"
              value={fromList(exp.technologies)}
              placeholder="e.g. Node.js, React, PostgreSQL"
              onChange={(e) => onChange(replaceAt(value, i, { technologies: toList(e.target.value) }))}
            />
          </Field>
          <RemoveButton label={`Remove ${exp.role || 'experience'}`} onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      </div>
    ))}
  </div>
);

export const EducationEditor: React.FC<{ value: CandidateEducation[]; onChange: (next: CandidateEducation[]) => void }> = ({ value, onChange }) => {
  const year = (v: string) => (v === '' ? undefined : parseInt(v, 10) || undefined);
  return (
    <div className="card p-6 space-y-4">
      <SectionHeader
        icon={<GraduationCap className="w-4 h-4 text-brand-600" />}
        title="Education"
        count={value.length}
        addLabel="Add education"
        onAdd={() => onChange([...value, { institution: '', degree: '', field_of_study: '', start_year: undefined as unknown as number, end_year: undefined, grade: '' }])}
      />
      {value.length === 0 && <p className="text-xs text-slate-500">No education yet.</p>}
      {value.map((edu, i) => (
        <div key={edu.id || i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="College / University *">
              <input className="input-text" value={edu.institution} placeholder="e.g. Anna University" onChange={(e) => onChange(replaceAt(value, i, { institution: e.target.value }))} />
            </Field>
            <Field label="Degree *">
              <input className="input-text" value={edu.degree} placeholder="e.g. B.Tech" onChange={(e) => onChange(replaceAt(value, i, { degree: e.target.value }))} />
            </Field>
            <Field label="Field of study">
              <input className="input-text" value={edu.field_of_study} placeholder="e.g. Computer Science" onChange={(e) => onChange(replaceAt(value, i, { field_of_study: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <Field label="Start year">
              <input type="number" className="input-text" value={edu.start_year || ''} placeholder="2018" onChange={(e) => onChange(replaceAt(value, i, { start_year: year(e.target.value) as number }))} />
            </Field>
            <Field label="End year">
              <input type="number" className="input-text" value={edu.end_year || ''} placeholder="2022" onChange={(e) => onChange(replaceAt(value, i, { end_year: year(e.target.value) }))} />
            </Field>
            <Field label="Grade / CGPA">
              <input className="input-text" value={edu.grade || ''} placeholder="e.g. 8.2 CGPA" onChange={(e) => onChange(replaceAt(value, i, { grade: e.target.value }))} />
            </Field>
            <div className="pb-2.5">
              <RemoveButton label={`Remove ${edu.institution || 'education'}`} onClick={() => onChange(value.filter((_, j) => j !== i))} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProjectsEditor: React.FC<{ value: CandidateProject[]; onChange: (next: CandidateProject[]) => void }> = ({ value, onChange }) => (
  <div className="card p-6 space-y-4">
    <SectionHeader
      icon={<FolderGit2 className="w-4 h-4 text-brand-600" />}
      title="Projects"
      count={value.length}
      addLabel="Add project"
      onAdd={() => onChange([...value, { title: '', description: '', url: '', technologies: [], bullets: [] }])}
    />
    {value.length === 0 && <p className="text-xs text-slate-500">No projects yet. Freshers: projects count towards your experience in tailored resumes.</p>}
    {value.map((proj, i) => (
      <div key={proj.id || i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Project name *">
            <input className="input-text" value={proj.title} placeholder="e.g. Expense tracker" onChange={(e) => onChange(replaceAt(value, i, { title: e.target.value }))} />
          </Field>
          <Field label="Link">
            <input className="input-text" value={proj.url || ''} placeholder="https://github.com/…" onChange={(e) => onChange(replaceAt(value, i, { url: e.target.value }))} />
          </Field>
        </div>
        <Field label="Short description">
          <input className="input-text" value={proj.description} placeholder="What it does, in one line" onChange={(e) => onChange(replaceAt(value, i, { description: e.target.value }))} />
        </Field>
        <Field label="Highlights (one per line)">
          <textarea rows={3} className="input-text leading-relaxed" value={fromLines(proj.bullets)} onChange={(e) => onChange(replaceAt(value, i, { bullets: toLines(e.target.value) }))} />
        </Field>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <Field label="Technologies (comma-separated)" className="flex-1">
            <input className="input-text" value={fromList(proj.technologies)} placeholder="e.g. React, Firebase" onChange={(e) => onChange(replaceAt(value, i, { technologies: toList(e.target.value) }))} />
          </Field>
          <RemoveButton label={`Remove ${proj.title || 'project'}`} onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      </div>
    ))}
  </div>
);

export const LinesEditor: React.FC<{ title: string; hint: string; value: string[]; onChange: (next: string[]) => void; placeholder?: string }> = ({
  title,
  hint,
  value,
  onChange,
  placeholder,
}) => (
  <div className="card p-6 space-y-3">
    <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
      <Award className="w-4 h-4 text-brand-600" />
      {title}
    </h2>
    <p className="text-[11px] text-slate-500">{hint}</p>
    <textarea rows={4} className="input-text leading-relaxed" value={fromLines(value)} placeholder={placeholder} onChange={(e) => onChange(toLines(e.target.value))} />
  </div>
);
