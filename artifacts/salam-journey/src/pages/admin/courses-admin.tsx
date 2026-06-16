import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Sparkles, ListPlus } from 'lucide-react';
import { apiJson } from '@/lib/api'; 
import type { AdminCourse } from './types';

type FormState = Omit<AdminCourse, 'id'> & { durationUnit?: string };

const EMPTY_FORM: FormState = {
  coachId: '00000000-0000-0000-0000-000000000000', 
  titleAr: '', titleEn: '', descAr: '', category: 'course',
  price: 0, duration: 0, status: 'active',
  gradient: 'linear-gradient(135deg, var(--sage-dark), var(--sage))',
  imageUrl: '',
  students: '0',
  durationUnit: 'weeks'
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
  const [courses, setCourses] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]); 
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [featuredMode, setFeaturedMode] = useState('most_loved'); 
  const [featuredCourseId, setFeaturedCourseId] = useState('');
  const [upcomingCourseId, setUpcomingCourseId] = useState('');
  const [savingFeatured, setSavingFeatured] = useState(false);

  const [f1, setF1] = useState('١٢ درس فيديو عالي الجودة');
  const [f2, setF2] = useState('ملفات عمل قابلة للتحميل');
  const [f3, setF3] = useState('جلسات أسئلة وأجوبة شهرية');
  const [f4, setF4] = useState('مجتمع خاص للأمهات');

  useEffect(() => {
    let cancelled = false;
    async function loadAllData() {
      try {
        setLoading(true);
        
        const [coursesData, coachesData, modeRes, featuredRes, upcomingRes, feat1, feat2, feat3, feat4] = await Promise.all([
          apiJson<any[]>('/courses'),
          apiJson<any>('/coaches').catch(() => []), 
          apiJson<{ value: string }>('/site-settings/featured_course_mode').catch(() => ({ value: "most_loved" })),
          apiJson<{ value: string }>('/site-settings/featured_course_id').catch(() => ({ value: "" })),
          apiJson<{ value: string }>('/site-settings/upcoming_course_id').catch(() => ({ value: "" })),
          apiJson<{ value: string }>('/site-settings/featured_feature_1').catch(() => ({ value: "١٢ درس فيديو عالي الجودة" })),
          apiJson<{ value: string }>('/site-settings/featured_feature_2').catch(() => ({ value: "ملفات عمل قابلة للتحميل" })),
          apiJson<{ value: string }>('/site-settings/featured_feature_3').catch(() => ({ value: "جلسات أسئلة وأجوبة شهرية" })),
          apiJson<{ value: string }>('/site-settings/featured_feature_4').catch(() => ({ value: "مجتمع خاص للأمهات" })),
        ]);

        if (!cancelled) {
          setCourses(coursesData);
          const extractedCoaches = Array.isArray(coachesData) ? coachesData : (coachesData?.coaches || coachesData?.data || []);
          setCoaches(extractedCoaches);

          setFeaturedMode(modeRes?.value || 'most_loved');
          setFeaturedCourseId(featuredRes?.value || '');
          setUpcomingCourseId(upcomingRes?.value || '');
          
          setF1(feat1?.value || '١٢ درس فيديو عالي الجودة');
          setF2(feat2?.value || 'ملفات عمل قابلة للتحميل');
          setF3(feat3?.value || 'جلسات أسئلة وأجوبة شهرية');
          setF4(feat4?.value || 'مجتمع خاص للأمهات');
        }
      } catch {
        if (!cancelled) setError('تعذر تحميل البيانات من قاعدة البيانات');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAllData();
    return () => { cancelled = true; };
  }, []);

  function openAdd() { 
    setForm({
      ...EMPTY_FORM,
      coachId: coaches.length > 0 ? coaches[0].id : EMPTY_FORM.coachId
    }); 
    setModal({ mode: 'add' }); 
  }

  function openEdit(c: any) {
    setForm({ 
      coachId: c.coachId || c.coach_id, 
      titleAr: c.titleAr || c.title_ar, 
      titleEn: c.titleEn || c.title_en, 
      descAr: c.descAr || c.desc_ar || '', 
      category: c.category, 
      price: c.price ?? 0, 
      duration: c.duration ?? 0, 
      students: c.students ?? '0', 
      status: c.status, 
      gradient: c.gradient ?? '', 
      imageUrl: c.imageUrl || c.image_url || '',
      durationUnit: c.durationUnit || c.duration_unit || 'weeks'
    });
    setModal({ mode: 'edit', id: c.id });
  }

  async function handleSave() {
    if (!form.titleAr.trim()) return;
    
    let finalCoachId = form.coachId;
    if (finalCoachId === '00000000-0000-0000-0000-000000000000' && coaches.length > 0) {
      finalCoachId = coaches[0].id;
    }

    const cleanPayload = {
      coachId: finalCoachId,
      titleAr: form.titleAr.trim(),
      titleEn: form.titleEn.trim(),
      descAr: form.descAr ? form.descAr.trim() : null,
      category: form.category,
      price: String(form.price || 0),           
      duration: Number(form.duration) || 0,     
      students: String(form.students || "0"),   
      status: form.status,
      gradient: form.gradient,
      imageUrl: form.imageUrl ? form.imageUrl.trim() : null,
      durationUnit: form.durationUnit || 'weeks',
      duration_unit: form.durationUnit || 'weeks'
    };

    try {
      if (modal?.mode === 'add') {
        const created = await apiJson<any>('/courses', { method: 'POST', body: JSON.stringify(cleanPayload) });
        setCourses((current) => [...current, created]);
      } else if (modal?.id) {
        const updated = await apiJson<any>(`/courses/${modal.id}`, { method: 'PUT', body: JSON.stringify(cleanPayload) });
        setCourses((current) => current.map((course) => (course.id === modal.id ? updated : course)));
      }
      setModal(null);
    } catch (err: any) {
      alert(`فشل الحفظ: ${err?.message || 'تأكد من البيانات'}`);
    }
  }

  async function handleSaveFeatured() {
    try {
      setSavingFeatured(true);
      await Promise.all([
        apiJson('/admin/site-settings/featured_course_mode', { method: 'PUT', body: JSON.stringify({ value: featuredMode }) }),
        apiJson('/admin/site-settings/featured_course_id', { method: 'PUT', body: JSON.stringify({ value: featuredCourseId }) }),
        apiJson('/admin/site-settings/upcoming_course_id', { method: 'PUT', body: JSON.stringify({ value: upcomingCourseId }) }),
        apiJson('/admin/site-settings/featured_feature_1', { method: 'PUT', body: JSON.stringify({ value: f1 }) }),
        apiJson('/admin/site-settings/featured_feature_2', { method: 'PUT', body: JSON.stringify({ value: f2 }) }),
        apiJson('/admin/site-settings/featured_feature_3', { method: 'PUT', body: JSON.stringify({ value: f3 }) }),
        apiJson('/admin/site-settings/featured_feature_4', { method: 'PUT', body: JSON.stringify({ value: f4 }) }),
      ]);
      alert('تم تحديث إعدادات ومميزات السكشن بنجاح ✓');
    } catch {
      alert('تعذر حفظ التعديلات في قاعدة البيانات');
    } finally {
      setSavingFeatured(false);
    }
  }

  async function toggleStatus(id: string) {
    const course = courses.find((item) => item.id === id);
    if (!course) return;
    const nextStatus = course.status === 'active' ? 'hidden' : 'active';
    try {
      const updated = await apiJson<any>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify({ status: nextStatus }) });
      setCourses((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch { }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await apiJson(`/courses/${deleteId}`, { method: 'DELETE' });
      setCourses((current) => current.filter((course) => course.id !== deleteId));
      setDeleteId(null);
    } catch { }
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
                    <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: c.gradient || 'var(--sage)' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-dark)' }}>{c.titleAr || c.title_ar}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{c.price}</td>
                {/* 🌟 تم حل المشكلة هنا بإضافة النوع الصريح (as keyof typeof CATEGORY_LABELS) لمنع الـ compiler من الاعتراض */}
                <td className="px-4 py-3">
                  {CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category}
                </td>
                <td className="px-4 py-3">{c.students}</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: c.status === 'active' ? 'rgba(90,138,128,0.12)' : 'rgba(0,0,0,0.06)', color: c.status === 'active' ? 'var(--sage-dark)' : 'var(--text-muted)' }}>
                    {c.status === 'active' ? 'نشط' : 'مخفي'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-[var(--cream)]"><Pencil size={14} /></button>
                    <button type="button" onClick={() => void toggleStatus(c.id)} className="p-1.5 rounded-lg hover:bg-[var(--cream)]">
                      {c.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8" style={{ background: 'white', boxShadow: '0 2px 12px rgba(90,138,128,0.08)', border: '1px solid rgba(127,169,155,0.12)' }}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-bold" style={{ color: 'var(--text-dark)' }}>
              <Sparkles size={18} style={{ color: 'var(--sage)' }} />
              <h2>خيارات العرض والكورسات</h2>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>نوع العرض الحركي حالياً:</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFeaturedMode('most_loved')} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: featuredMode === 'most_loved' ? 'var(--sage)' : 'var(--cream)', color: featuredMode === 'most_loved' ? 'white' : 'var(--text-body)' }}>🔥 الأكثر طلباً</button>
                <button type="button" onClick={() => setFeaturedMode('upcoming')} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: featuredMode === 'upcoming' ? 'var(--sage)' : 'var(--cream)', color: featuredMode === 'upcoming' ? 'white' : 'var(--text-body)' }}>⏳ قادمة قريباً</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>كورس الأكثر طلباً:</label>
              <select value={featuredCourseId} onChange={(e) => setFeaturedCourseId(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)' }}>
                <option value="">-- اختر دورة --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{(c.titleAr || c.title_ar)}{c.status === 'hidden' ? ' (مخفية)' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>كورس قادمة قريباً:</label>
              <select value={upcomingCourseId} onChange={(e) => setUpcomingCourseId(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)' }}>
                <option value="">-- اختر دورة --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{(c.titleAr || c.title_ar)}{c.status === 'hidden' ? ' (مخفية)' : ''}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold mb-1" style={{ color: 'var(--text-dark)' }}>
              <ListPlus size={18} style={{ color: 'var(--sage)' }} />
              <h2>نقاط ومميزات السكشن الأساسية</h2>
            </div>
            <FormField label="الميزة الأولى" value={f1} onChange={setF1} />
            <FormField label="الميزة الثانية" value={f2} onChange={setF2} />
            <FormField label="الميزة الثالث" value={f3} onChange={setF3} />
            <FormField label="الميزة الرابعة" value={f4} onChange={setF4} />
            
            <button type="button" onClick={handleSaveFeatured} disabled={savingFeatured} className="w-full py-2.5 mt-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'var(--sage)' }}>
              {savingFeatured ? 'جاري الحفظ...' : 'حفظ إعدادات ومميزات السكشن كاملة'}
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,74,69,0.45)' }}>
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--cream-dark)' }}>
              <h2 className="font-bold text-lg">{modal.mode === 'add' ? 'إضافة دورة جديدة' : 'تعديل الدورة'}</h2>
              <button type="button" onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>المدرب المسؤول عن الدورة</label>
                <select value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)' }}>
                  {coaches.map(ch => <option key={ch.id} value={ch.id}>{ch.nameAr || ch.name || ch.nameEn}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="اسم الدورة (AR)" value={form.titleAr} onChange={(v) => setForm({ ...form, titleAr: v })} />
                <FormField label="اسم الدورة (EN)" value={form.titleEn} onChange={(v) => setForm({ ...form, titleEn: v })} />
              </div>
              <FormField label="الوصف (AR)" value={form.descAr ?? ''} onChange={(v) => setForm({ ...form, descAr: v })} multiline />
              
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="col-span-2">
                  <FormField label="المدة الزمنية" value={String(form.duration || '')} onChange={(v) => setForm({ ...form, duration: Number(v) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>الوحدة المعتمدة</label>
                  <select value={form.durationUnit || 'weeks'} onChange={(e) => setForm({ ...form, durationUnit: e.target.value })} className="w-full rounded-xl px-2 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}>
                    <option value="weeks">أسبوع</option>
                    <option value="minutes">دقائق</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="السعر" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) || 0 })} />
                <FormField label="الطلاب المشاركين" value={form.students || '0'} onChange={(v) => setForm({ ...form, students: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">نوع الدورة</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)' }}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">الحالة</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)' }}>
                    <option value="active">نشط</option><option value="hidden">مخفي</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">صورة الغلاف (رابط)</label>
                <input type="text" value={form.imageUrl ?? ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)' }} />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button type="button" onClick={() => void handleSave()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--sage)' }}>حفظ</button>
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--cream)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,74,69,0.5)' }}>
          <div className="rounded-2xl p-8 max-w-sm w-full text-center space-y-4" style={{ background: 'white' }}>
            <p className="text-lg font-bold">حذف الدورة؟</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => void confirmDelete()} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#B5524A' }}>حذف</button>
              <button type="button" onClick={() => setDeleteId(null)} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--cream)' }}>إلغاء</button>
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