import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, X } from 'lucide-react';
import type { AdminTestimonial } from './types';

type FormState = Omit<AdminTestimonial, 'id'>;
const EMPTY: FormState = { nameAr: '', roleAr: '', quoteAr: '', rating: 5, status: 'active' };

export function AdminTestimonials() {
  const [items, setItems] = useState<AdminTestimonial[]>([]);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTestimonials() {
      try {
        setLoading(true);
        const response = await fetch('/api/testimonials');
        if (!response.ok) throw new Error('failed');
        const data = (await response.json()) as AdminTestimonial[];
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) {
          setError('تعذر تحميل الشهادات من قاعدة البيانات');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTestimonials();
    return () => {
      cancelled = true;
    };
  }, []);

  function openAdd() { setForm(EMPTY); setModal({ mode: 'add' }); }
  function openEdit(t: AdminTestimonial) {
    setForm({ nameAr: t.nameAr, roleAr: t.roleAr, quoteAr: t.quoteAr, rating: t.rating, status: t.status });
    setModal({ mode: 'edit', id: t.id });
  }

  async function handleSave() {
    if (!form.nameAr.trim()) return;
    if (modal?.mode === 'add') {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) return;
      const created = (await response.json()) as AdminTestimonial;
      setItems((current) => [...current, created]);
    } else if (modal?.id) {
      const response = await fetch(`/api/testimonials/${modal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) return;
      const updated = (await response.json()) as AdminTestimonial;
      setItems((current) => current.map((t) => (t.id === modal.id ? updated : t)));
    }
    setModal(null);
  }

  async function toggleStatus(id: string) {
    const testimonial = items.find((t) => t.id === id);
    if (!testimonial) return;
    const nextStatus = testimonial.status === 'active' ? 'hidden' : 'active';
    const response = await fetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as AdminTestimonial;
    setItems((current) => current.map((t) => (t.id === id ? updated : t)));
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const response = await fetch(`/api/testimonials/${deleteId}`, { method: 'DELETE' });
    if (!response.ok) return;
    setItems((current) => current.filter((t) => t.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>إدارة الشهادات</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{items.length} شهادة — {items.filter((t) => t.status === 'active').length} نشطة</p>
        </div>
        <button type="button" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--sage)' }}>
          <Plus size={15} /> إضافة شهادة
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>جارٍ تحميل الشهادات...</p>}
      {!loading && error && <p className="text-sm" style={{ color: '#B5524A' }}>{error}</p>}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 2px 12px rgba(90,138,128,0.08)', border: '1px solid rgba(127,169,155,0.12)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(127,169,155,0.08)' }}>
              {['#', 'الاسم', 'التقييم', 'النص', 'الحالة', 'إجراءات'].map((h) => (
                <th key={h} className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-dark)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((t, i) => (
              <tr key={t.id} className="border-t" style={{ borderColor: 'rgba(127,169,155,0.08)' }}>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium" style={{ color: 'var(--text-dark)' }}>{t.nameAr}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.roleAr}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={13} fill={j < t.rating ? 'var(--blush)' : 'transparent'} stroke={j < t.rating ? 'var(--blush)' : 'var(--text-muted)'} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-xs leading-relaxed truncate" style={{ color: 'var(--text-body)' }}>{t.quoteAr}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: t.status === 'active' ? 'rgba(90,138,128,0.12)' : 'rgba(0,0,0,0.06)', color: t.status === 'active' ? 'var(--sage-dark)' : 'var(--text-muted)' }}>
                    {t.status === 'active' ? 'نشط' : 'مخفي'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-[var(--cream)]"><Pencil size={14} style={{ color: 'var(--sage-dark)' }} /></button>
                    <button type="button" onClick={() => void toggleStatus(t.id)} className="p-1.5 rounded-lg hover:bg-[var(--cream)]">
                      {t.status === 'active' ? <EyeOff size={14} style={{ color: 'var(--text-muted)' }} /> : <Eye size={14} style={{ color: 'var(--sage)' }} />}
                    </button>
                    <button type="button" onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} style={{ color: '#B5524A' }} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,74,69,0.5)' }}>
          <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--cream-dark)' }}>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>{modal.mode === 'add' ? 'إضافة شهادة' : 'تعديل الشهادة'}</h2>
              <button type="button" onClick={() => setModal(null)}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="الاسم" value={form.nameAr} onChange={(v) => setForm({ ...form, nameAr: v })} />
                <Field label="الوصف (أم لطفلين، إلخ)" value={form.roleAr} onChange={(v) => setForm({ ...form, roleAr: v })} />
              </div>
              <Field label="نص الشهادة" value={form.quoteAr} onChange={(v) => setForm({ ...form, quoteAr: v })} multiline />
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>التقييم</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}>
                      <Star size={24} fill={n <= form.rating ? 'var(--blush)' : 'transparent'} stroke={n <= form.rating ? 'var(--blush)' : 'var(--text-muted)'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>الحالة</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AdminTestimonial['status'] })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}>
                  <option value="active">نشط</option><option value="hidden">مخفي</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button type="button" onClick={() => void handleSave()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--sage)' }}>حفظ</button>
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--cream)', color: 'var(--text-dark)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,74,69,0.5)' }}>
          <div className="rounded-2xl p-8 max-w-sm w-full text-center space-y-4" style={{ background: 'white' }}>
            <p className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>حذف الشهادة؟</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => void confirmDelete()} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#B5524A' }}>حذف</button>
              <button type="button" onClick={() => setDeleteId(null)} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--cream)', color: 'var(--text-dark)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const style = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>{label}</label>
      {multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} style={{ ...style, resize: 'none' }} /> : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} style={style} />}
    </div>
  );
}
