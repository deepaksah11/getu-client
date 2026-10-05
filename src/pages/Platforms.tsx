import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MonitorSmartphone,
  ShieldCheck,
  Trash2,
  LogIn,
  Building2,
  Save,
  Lock,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAppStore } from '../store/index.js';
import { CardSkeleton } from '../components/Skeleton.js';
import { PlatformBoards, PlatformInfo, PlatformConnectionStatus } from '../types/index.js';

const STATUS_LABEL: Record<PlatformConnectionStatus, { text: string; tone: string }> = {
  not_connected: { text: 'Not connected', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  credentials_saved: { text: 'Login saved', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  connecting: { text: 'Signing in…', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  awaiting_user: { text: 'Finish in browser window', tone: 'bg-amber-50 text-amber-800 border-amber-300' },
  connected: { text: 'Connected', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  needs_verification: { text: 'Verification needed', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  failed: { text: 'Login failed', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const BUSY: PlatformConnectionStatus[] = ['connecting', 'awaiting_user'];

const LoginForm: React.FC<{ platform: PlatformInfo; onDone: () => void }> = ({ platform, onDone }) => {
  const { addToast } = useAppStore();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState(platform.connection?.username || '');
  const [password, setPassword] = useState('');

  const save = useMutation({
    mutationFn: () => api.saveCredentials(platform.id, username.trim(), password),
    onSuccess: () => {
      setPassword('');
      addToast({ type: 'success', title: 'Login saved', message: `Signing in to ${platform.name} to verify…` });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      onDone();
    },
    onError: (err: any) => addToast({ type: 'error', title: 'Could not save login', message: err.message }),
  });

  const needsPassword = !platform.connection?.has_password;
  return (
    <form
      className="space-y-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <input
        className="input-text"
        type="text"
        autoComplete="username"
        placeholder={`${platform.name} email or phone`}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        className="input-text"
        type="password"
        autoComplete="current-password"
        placeholder={needsPassword ? 'Password' : 'New password (leave empty to keep the saved one)'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required={needsPassword}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Encrypted and stored only on this computer
        </span>
        <button type="submit" className="btn-primary py-1.5 px-3 text-xs" disabled={save.isPending || !username.trim()}>
          {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
          Save & sign in
        </button>
      </div>
    </form>
  );
};

const PlatformCard: React.FC<{ platform: PlatformInfo; onToggle: (id: string) => void; toggling: boolean }> = ({ platform, onToggle, toggling }) => {
  const { addToast } = useAppStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const status = platform.connection?.status || 'not_connected';
  const label = STATUS_LABEL[status];
  const hasLogin = Boolean(platform.connection?.has_password || platform.connection?.has_session);

  const connect = useMutation({
    mutationFn: () => api.connectPlatform(platform.id, true),
    onSuccess: () => {
      addToast({
        type: 'info',
        title: 'Browser window opening',
        message: `Complete any code or CAPTCHA for ${platform.name} in the window that opens. It closes by itself when you are signed in.`,
      });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
    },
    onError: (err: any) => addToast({ type: 'error', title: 'Connect failed', message: err.message }),
  });

  const remove = useMutation({
    mutationFn: () => api.removeCredentials(platform.id),
    onSuccess: () => {
      addToast({ type: 'success', message: `${platform.name} login removed.` });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
    },
  });

  return (
    <div className={`card p-5 flex flex-col gap-3 ${platform.enabled ? 'ring-2 ring-brand-500/20 border-brand-300' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">{platform.name}</h3>
            {platform.requires_login ? (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Login required</span>
            ) : (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">No login needed</span>
            )}
            {platform.needs_visible_browser && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 flex items-center gap-1">
                <MonitorSmartphone className="w-3 h-3" /> Uses a browser window
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-snug">{platform.description}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0 select-none">
          <span className="text-[11px] font-semibold text-slate-600">{platform.enabled ? 'Applying' : 'Off'}</span>
          <button
            type="button"
            role="switch"
            aria-checked={platform.enabled}
            aria-label={`Apply on ${platform.name}`}
            disabled={toggling}
            onClick={() => onToggle(platform.id)}
            className={`relative w-10 h-6 rounded-full transition-colors ${platform.enabled ? 'bg-brand-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${platform.enabled ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </label>
      </div>

      {platform.requires_login && platform.connection && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${label.tone}`}>
              {status === 'connected' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : BUSY.includes(status) ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : status === 'failed' || status === 'needs_verification' ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              {label.text}
            </span>
            {platform.connection.username && <span className="text-[11px] text-slate-500 truncate">{platform.connection.username}</span>}
          </div>

          {platform.connection.last_error && !BUSY.includes(status) && status !== 'connected' && (
            <p className="text-[11px] text-rose-700 leading-snug">{platform.connection.last_error}</p>
          )}
          {status === 'awaiting_user' && (
            <p className="text-[11px] text-amber-800 leading-snug">
              A browser window is open. Enter the code or solve the check there; this page updates when you are signed in.
            </p>
          )}

          {!hasLogin || editing ? (
            <LoginForm platform={platform} onDone={() => setEditing(false)} />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn-secondary py-1.5 px-3 text-xs"
                disabled={connect.isPending || BUSY.includes(status)}
                onClick={() => connect.mutate()}
                title="Opens a browser window so you can complete OTP / CAPTCHA once"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {status === 'connected' ? 'Re-check login' : 'Connect (opens browser)'}
              </button>
              <button className="btn-secondary py-1.5 px-3 text-xs" onClick={() => setEditing(true)}>
                <KeyRound className="w-3.5 h-3.5" /> Change login
              </button>
              <button
                className="btn-secondary py-1.5 px-3 text-xs text-rose-700"
                onClick={() => window.confirm(`Remove the saved ${platform.name} login and session?`) && remove.mutate()}
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          )}
        </div>
      )}

      {platform.notes && <p className="text-[11px] text-slate-500 leading-snug">{platform.notes}</p>}
    </div>
  );
};

const BoardsEditor: React.FC<{ boards: PlatformBoards }> = ({ boards }) => {
  const { addToast } = useAppStore();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    greenhouse_boards: boards.greenhouse_boards.join(', '),
    lever_companies: boards.lever_companies.join(', '),
    ashby_boards: boards.ashby_boards.join(', '),
  });
  const save = useMutation({
    mutationFn: () =>
      api.saveBoards({
        greenhouse_boards: form.greenhouse_boards.split(',').map((s) => s.trim()).filter(Boolean),
        lever_companies: form.lever_companies.split(',').map((s) => s.trim()).filter(Boolean),
        ashby_boards: form.ashby_boards.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      addToast({ type: 'success', message: 'Company boards saved.' });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
    },
    onError: (err: any) => addToast({ type: 'error', message: err.message }),
  });

  const fields: { key: keyof typeof form; label: string; example: string }[] = [
    { key: 'greenhouse_boards', label: 'Greenhouse company boards', example: 'job-boards.greenhouse.io/<board>' },
    { key: 'lever_companies', label: 'Lever companies', example: 'jobs.lever.co/<company>' },
    { key: 'ashby_boards', label: 'Ashby boards', example: 'jobs.ashbyhq.com/<board>' },
  ];

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-semibold text-slate-900">Companies watched on Greenhouse, Lever and Ashby</h2>
        </div>
        <button className="btn-primary py-1.5 px-3 text-xs" onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="w-3.5 h-3.5" /> Save boards
        </button>
      </div>
      <p className="text-xs text-slate-500">
        These ATS platforms have no central search, so the bot checks these companies' boards. Add a company by the name in its careers URL.
      </p>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {f.label} <span className="font-normal text-slate-400">({f.example})</span>
          </label>
          <textarea
            className="input-text font-mono text-xs"
            rows={2}
            value={form[f.key]}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
};

export const Platforms: React.FC = () => {
  const { addToast, activeUserId } = useAppStore();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['platforms', activeUserId],
    queryFn: () => api.getPlatforms(),
    refetchInterval: (query) =>
      query.state.data?.data.some((p) => p.connection && BUSY.includes(p.connection.status)) ? 2500 : false,
  });

  const [enabled, setEnabled] = useState<string[]>([]);
  useEffect(() => {
    if (data) setEnabled(data.enabled_platforms);
  }, [data]);

  const toggle = useMutation({
    mutationFn: (next: string[]) => api.setEnabledPlatforms(next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: any) => addToast({ type: 'error', message: err.message }),
  });

  if (isLoading || !data) return <CardSkeleton />;

  const onToggle = (id: string) => {
    const next = enabled.includes(id) ? enabled.filter((p) => p !== id) : [...enabled, id];
    setEnabled(next);
    toggle.mutate(next);
  };

  const platforms = data.data.map((p) => ({ ...p, enabled: enabled.includes(p.id) }));
  const loginPlatforms = platforms.filter((p) => p.requires_login);
  const openPlatforms = platforms.filter((p) => !p.requires_login);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-brand-600" /> Platforms & Logins
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Turn on the platforms to apply on. For job portals, enter your login once: it is encrypted on this computer, the
          bot signs in for you and keeps the session, and signs in again by itself when the session expires. If a portal
          asks for an OTP or CAPTCHA, click <strong>Connect</strong> and complete it once in the browser window.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Job portals (your account)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loginPlatforms.map((p) => (
            <PlatformCard key={p.id} platform={p} onToggle={onToggle} toggling={toggle.isPending} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Company career boards (no login)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {openPlatforms.map((p) => (
            <PlatformCard key={p.id} platform={p} onToggle={onToggle} toggling={toggle.isPending} />
          ))}
        </div>
      </section>

      <BoardsEditor key={JSON.stringify(data.boards)} boards={data.boards} />
    </div>
  );
};
