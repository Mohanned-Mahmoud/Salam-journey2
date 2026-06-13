import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { apiJson } from '@/lib/api'; 
import type { AdminCourse } from './types';

type FormState = Omit<AdminCourse, 'id'>;

const EMPTY_FORM: FormState = {
  coachId: '00000000-0000-0000-0000-000000000000', 
  titleAr: '', titleEn: '', descAr: '', category: 'course',
  price: 0, duration: 0, status: 'active',
  gradient: 'linear-gradient(135deg, var(--sage-dark), var(--sage))',
  imageUrl: '',
  students: '0'
};

const CATEGORY_LABELS: Record<AdminCourse['category'], string> = { course: 'دورة مسجّلة', workshop: 'ورشة مباشرة', free: 'مجاناً' };
const GRADIENTS = [
  'linear-gradient(135deg, var(--sage-dark), var(--sage))',
  'linear-gradient(135deg, var(--blush), var(--blush-light))',
  'linear-gradient(135deg, var(--sage), var(--sage-light))',
  'linear-gradient(135deg, var(--cream-dark), var(--blush-light))',
  'linear-gradient(135deg, var(--sage-light), var(--sage-muted))',
];

export function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      try {
        setLoading(true);
        const data = await apiJson<AdminCourse[]>('/courses');
        if (!cancelled) setCourses(data);
      } catch {
        if (!cancelled) {
          setError('تعذر تحميل الدورات من قاعدة البيانات');
          setCourses([]);
        }
      } finally { // 🌟 تم تصحيح الإملاء هنا لتفادي انهيار السيرفر
        if (!cancelled) setLoading(false);
      }
    }
    void loadCourses();
    return () => { cancelled = true; };
  }, []);

  function openAdd() { setForm(EMPTY_FORM); setModal({ mode: 'add' }); }
  function openEdit(c: AdminCourse) {
    setForm({ 
      coachId: c.coachId, 
      titleAr: c.titleAr, 
      titleEn: c.titleEn, 
      descAr: c.descAr ?? '', 
      category: c.category, 
      price: c.price ?? 0, 
      duration: c.duration ?? 0, 
      students: c.students ?? '0', 
      status: c.status, 
      gradient: c.gradient ?? '', 
      imageUrl: c.imageUrl ?? '' 
    });
    setModal({ mode: 'edit', id: c.id });
  }

  async function handleSave() {
    if (!form.titleAr.trim()) return;
    try {
      if (modal?.mode === 'add') {
        const created = await apiJson<AdminCourse>('/courses', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        setCourses((current) => [...current, created]);
      } else if (modal?.id) {
        const updated = await apiJson<AdminCourse>(`/courses/${modal.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        setCourses((current) => current.map((course) => (course.id === modal.id ? updated : course)));
      }
      setModal(null);
    } catch {
      // error handle
    }
  }

  async function toggleStatus(id: string) {
    const course = courses.find((item) => item.id === id);
    if (!course) return;
    const nextStatus = course.status === 'active' ? 'hidden' : 'active';
    try {
      const updated = await apiJson<AdminCourse>(`/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      setCourses((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch {
      // error handle
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await apiJson(`/courses/${deleteId}`, { method: 'DELETE' });
      setCourses((current) => current.filter((course) => course.id !== deleteId));
      setDeleteId(null);
    } catch {
      // error handle
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>إدارة الدورات</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{courses.length} دورة</p>
        </div>
        <button type="button" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--sage)' }}>
          <Plus size={15} /> إضافة دورة
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>جارٍ تحميل الدورات...</p>}
      {!loading && error && <p className="text-sm" style={{ color: '#B5524A' }}>{error}</p>}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 2px 12px rgba(90,138,128,0.08)', border: '1px solid rgba(127,169,155,0.12)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(127,169,155,0.08)' }}>
              {['#', 'اسم الدورة', 'السعر', 'النوع', 'الطلاب', 'الحالة', 'إجراءات'].map((h) => (
                <th key={h} className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-dark)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={c.id} className="border-t" style={{ borderColor: 'rgba(127,169,155,0.08)' }}>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.titleAr} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      /* 🌟 استخدام undefined بدلاً من النص الفاضي لإرضاء الـ CSS Background Type */
                      <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: c.gradient ?? undefined }} />
                    )}
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-dark)' }}>{c.titleAr}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.titleEn}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{c.price}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{CATEGORY_LABELS[c.category]}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{c.students}</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: c.status === 'active' ? 'rgba(90,138,128,0.12)' : 'rgba(0,0,0,0.06)', color: c.status === 'active' ? 'var(--sage-dark)' : 'var(--text-muted)' }}>
                    {c.status === 'active' ? 'نشط' : 'مخفي'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-[var(--cream)]"><Pencil size={14} style={{ color: 'var(--sage-dark)' }} /></button>
                    <button type="button" onClick={() => void toggleStatus(c.id)} className="p-1.5 rounded-lg hover:bg-[var(--cream)]">
                      {c.status === 'active' ? <EyeOff size={14} style={{ color: 'var(--text-muted)' }} /> : <Eye size={14} style={{ color: 'var(--sage)' }} />}
                    </button>
                    <button type="button" onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} style={{ color: '#B5524A' }} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,74,69,0.45)' }}>
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--cream-dark)' }}>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>{modal.mode === 'add' ? 'إضافة دورة جديدة' : 'تعديل الدورة'}</h2>
              <button type="button" onClick={() => setModal(null)}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="اسم الدورة (AR)" value={form.titleAr} onChange={(v) => setForm({ ...form, titleAr: v })} />
                <FormField label="اسم الدورة (EN)" value={form.titleEn} onChange={(v) => setForm({ ...form, titleEn: v })} />
              </div>
              <FormField label="الوصف (AR)" value={form.descAr ?? ''} onChange={(v) => setForm({ ...form, descAr: v })} multiline />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="السعر" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) || 0 })} />
                <FormField label="المدة (بالدقائق أو الأسابيع)" value={String(form.duration ?? '')} onChange={(v) => setForm({ ...form, duration: Number(v) || 0 })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>نوع الدورة</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as AdminCourse['category'] })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>الحالة</label>
                  <select value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as AdminCourse['status'] })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}>
                    <option value="active">نشط</option><option value="hidden">مخفي</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>لون الغلاف</label>
                <div className="flex gap-2 flex-wrap">
                  {GRADIENTS.map((g) => (
                    <button key={g} type="button" onClick={() => setForm({ ...form, gradient: g })} className="w-10 h-10 rounded-xl transition-all" style={{ background: g, outline: form.gradient === g ? '3px solid var(--sage-dark)' : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>صورة الغلاف (رابط)</label>
                <input type="text" value={form.imageUrl ?? ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }} />
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
            <p className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>حذف الدورة؟</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>لا يمكن التراجع عن هذا الإجراء.</p>
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

function FormField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const style = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} style={{ ...style, resize: 'none' }} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} style={style} />
      }
    </div>
  );
}
