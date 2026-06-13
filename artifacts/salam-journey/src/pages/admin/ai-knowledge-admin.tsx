import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Brain, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiJson } from '@/lib/api';

type KnowledgeEntry = { id: string; title: string; content: string; updatedAt: string };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid rgba(127,169,155,0.2)' }}>
      <p className="font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>{title}</p>
      {children}
    </div>
  );
}

function EntryRow({
  entry,
  onSave,
  onDelete,
}: {
  entry: KnowledgeEntry;
  onSave: (id: string, title: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = title !== entry.title || content !== entry.content;

  async function save() {
    setSaving(true);
    await onSave(entry.id, title, content);
    setSaving(false);
  }

  async function del() {
    if (!confirm('هل أنتِ متأكدة من حذف هذا الإدخال؟')) return;
    setDeleting(true);
    await onDelete(entry.id);
  }

  const inp = "w-full rounded-xl px-3 py-2 text-sm outline-none";
  const inpStyle = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(127,169,155,0.2)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-right transition-colors"
        style={{ background: open ? 'var(--sage-muted)' : 'var(--cream)' }}
      >
        <span className="font-medium text-sm" style={{ color: 'var(--text-dark)' }}>{title}</span>
        <div className="flex items-center gap-2">
          {dirty && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {open && (
        <div className="p-4 space-y-3" style={{ background: '#fff' }}>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>العنوان</label>
            <input className={inp} style={inpStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>المحتوى</label>
            <textarea
              className={inp}
              style={{ ...inpStyle, minHeight: 120, resize: 'vertical' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={del}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(181,82,74,0.08)', color: '#B5524A' }}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              حذف
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'var(--sage-dark)' }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              حفظ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminAiKnowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const rows = await apiJson<KnowledgeEntry[]>('/ai/knowledge');
      setEntries(rows);
    } catch {
      setError('تعذّر تحميل قاعدة المعرفة. تأكد من تشغيل الخادم.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newTitle.trim() || !newContent.trim()) return;
    setAdding(true);
    try {
      const row = await apiJson<KnowledgeEntry>('/ai/knowledge', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() }),
      });
      setEntries((prev) => [...prev, row]);
      setNewTitle('');
      setNewContent('');
    } catch {
      alert('حدث خطأ أثناء الإضافة');
    } finally {
      setAdding(false);
    }
  }

  async function handleSave(id: string, title: string, content: string) {
    const row = await apiJson<KnowledgeEntry>(`/ai/knowledge/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    });
    setEntries((prev) => prev.map((e) => (e.id === id ? row : e)));
  }

  async function handleDelete(id: string) {
    await apiJson(`/ai/knowledge/${id}`, { method: 'DELETE' });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const inp = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const inpStyle = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>قاعدة معرفة المساعد الذكي</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            المعلومات التي يستخدمها المساعد الذكي للإجابة على أسئلة الأمهات
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--sage-muted)', color: 'var(--sage-dark)' }}
        >
          <Brain size={20} />
        </div>
      </div>

      {/* Info box */}
      <div
        className="flex gap-3 p-4 rounded-2xl text-sm"
        style={{ background: 'rgba(127,169,155,0.1)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-body)' }}
      >
        <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--sage-dark)' }} />
        <span>
          المساعد الذكي يجيب <strong>فقط</strong> بناءً على المعلومات الموجودة هنا. أضيفي معلومات عن الدورات والجلسات والمنتجات لتحسين دقة الإجابات.
        </span>
      </div>

      {/* Add new entry */}
      <Card title="إضافة إدخال جديد">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>العنوان</label>
            <input
              className={inp}
              style={inpStyle}
              placeholder="مثال: الجلسات الفردية، الدورات، الأسعار..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>المحتوى</label>
            <textarea
              className={inp}
              style={{ ...inpStyle, minHeight: 100, resize: 'vertical' }}
              placeholder="اكتبي المعلومات التفصيلية هنا..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !newTitle.trim() || !newContent.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'var(--sage-dark)' }}
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              إضافة
            </button>
          </div>
        </div>
      </Card>

      {/* Existing entries */}
      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-dark)' }}>
          الإدخالات الحالية ({entries.length})
        </p>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sage)' }} />
          </div>
        )}

        {error && (
          <div className="rounded-2xl p-4 text-sm flex items-center gap-2" style={{ background: 'rgba(181,82,74,0.08)', color: '#B5524A' }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center text-sm"
            style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}
          >
            لا توجد إدخالات بعد. أضيفي معلومات أعلاه لتدريب المساعد الذكي.
            <br />
            <span className="text-xs mt-1 block opacity-75">سيستخدم المساعد معلوماته الافتراضية حتى ذلك الحين.</span>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((e) => (
              <EntryRow key={e.id} entry={e} onSave={handleSave} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
