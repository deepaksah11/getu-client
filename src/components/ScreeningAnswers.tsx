import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, Save, Trash2, Plus, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { useAppStore } from '../store/index.js';
import { AnswerBankEntry } from '../types/index.js';

const AnswerRow: React.FC<{ entry: AnswerBankEntry }> = ({ entry }) => {
  const { addToast } = useAppStore();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(entry.answer || '');
  useEffect(() => setValue(entry.answer || ''), [entry.answer]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['answers'] });
    queryClient.invalidateQueries({ queryKey: ['readiness'] });
  };
  const save = useMutation({
    mutationFn: () => api.saveAnswer(entry.id, value.trim()),
    onSuccess: () => {
      addToast({ type: 'success', message: 'Answer saved. Waiting applications will use it on the next run.' });
      invalidate();
    },
    onError: (err: any) => addToast({ type: 'error', message: err.message }),
  });
  const remove = useMutation({ mutationFn: () => api.deleteAnswer(entry.id), onSuccess: invalidate });

  const pending = !entry.answer;
  const changed = value.trim() !== (entry.answer || '');
  return (
    <div className={`p-3 rounded-lg border ${pending ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold text-slate-900">
          {pending && <AlertCircle className="w-3.5 h-3.5 text-amber-600 inline mr-1 -mt-0.5" />}
          {entry.question}
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">
          {entry.platform ? `${entry.platform} · ` : ''}asked {entry.times_seen}×
        </span>
      </div>
      <div className="flex gap-2 mt-2">
        {entry.options && entry.options.length > 0 ? (
          <select className="input-text py-1.5 text-xs" value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">Choose an answer…</option>
            {entry.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input className="input-text py-1.5 text-xs" value={value} placeholder="Your answer" onChange={(e) => setValue(e.target.value)} />
        )}
        <button className="btn-primary py-1.5 px-3 text-xs" disabled={!value.trim() || !changed || save.isPending} onClick={() => save.mutate()}>
          <Save className="w-3.5 h-3.5" />
        </button>
        <button className="btn-secondary py-1.5 px-2 text-xs" aria-label="Delete question" onClick={() => remove.mutate()}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const ScreeningAnswers: React.FC = () => {
  const { activeUserId, addToast } = useAppStore();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['answers', activeUserId], queryFn: () => api.getAnswers() });
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const add = useMutation({
    mutationFn: () => api.addAnswer(question.trim(), answer.trim()),
    onSuccess: () => {
      setQuestion('');
      setAnswer('');
      queryClient.invalidateQueries({ queryKey: ['answers'] });
    },
    onError: (err: any) => addToast({ type: 'error', message: err.message }),
  });

  // Links like /profile#screening-answers land on this section
  useEffect(() => {
    if (data && window.location.hash === '#screening-answers') {
      document.getElementById('screening-answers')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data]);

  const entries = data?.data || [];
  return (
    <div id="screening-answers" className="card p-6 space-y-4 scroll-mt-20">
      <div className="border-b border-slate-100 pb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-brand-600" />
          Screening Answers {data?.pending ? <span className="text-amber-700">({data.pending} waiting for you)</span> : null}
        </h2>
      </div>
      <p className="text-xs text-slate-500">
        Employers' questions that your profile could not answer appear here. Answer each one once; it is reused for every
        future application and waiting applications resume on the next run.
      </p>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-400">No questions yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <AnswerRow key={e.id} entry={e} />
          ))}
        </div>
      )}

      <form
        className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 pt-2 border-t border-slate-100"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim().length >= 3 && answer.trim()) add.mutate();
        }}
      >
        <input className="input-text py-1.5 text-xs" placeholder="Add your own answer, e.g. 'Are you willing to work night shifts?'" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <input className="input-text py-1.5 text-xs" placeholder="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <button type="submit" className="btn-secondary py-1.5 px-3 text-xs" disabled={add.isPending}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </form>
    </div>
  );
};
