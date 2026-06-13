import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { apiJson } from '@/lib/api'; 
import type { AdminProduct } from './types';

type FormState = Omit<AdminProduct, 'id'>;

const EMPTY_FORM: FormState = {
  titleAr: '', titleEn: '', descAr: '', price: '', free: false,
  type: 'pdf', downloadUrl: '', status: 'active',
};

const TYPE_LABELS: Record<AdminProduct['type'], string> = { pdf: 'PDF', printable: 'مطبوعات', guide: 'دليل', other: 'أخرى' };

export function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        const data = await apiJson<Array<Omit<AdminProduct, 'free'> & { isFree?: boolean }>>('/products');
        if (!cancelled) {
          setProducts(data.map((product) => ({ ...product, free: Boolean(product.isFree) })));
        }
      } catch {
        if (!cancelled) {
          setError('تعذر تحميل المنتجات من قاعدة البيانات');
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  function openAdd() { setForm(EMPTY_FORM); setModal({ mode: 'add' }); }
  function openEdit(p: AdminProduct) {
    setForm({ 
      titleAr: p.titleAr, 
      titleEn: p.titleEn, 
      descAr: p.descAr ?? '', 
      price: p.price ?? '', 
      free: p.free, 
      type: p.type, 
      downloadUrl: p.downloadUrl ?? '', 
      status: p.status 
    });
    setModal({ mode: 'edit', id: p.id });
  }

  async function handleSave() {
    if (!form.titleAr.trim()) return;
    try {
      if (modal?.mode === 'add') {
        const created = await apiJson<Omit<AdminProduct, 'free'> & { isFree?: boolean }>('/products', {
          method: 'POST',
          body: JSON.stringify({ ...form, isFree: form.free }),
        });
        setProducts((current) => [...current, { ...created, free: Boolean(created.isFree) }]);
      } else if (modal?.id) {
        const updated = await apiJson<Omit<AdminProduct, 'free'> & { isFree?: boolean }>(`/products/${modal.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, isFree: form.free }),
        });
        setProducts((current) => current.map((product) => (product.id === modal.id ? { ...updated, free: Boolean(updated.isFree) } : product)));
      }
      setModal(null);
    } catch {
      // error handle
    }
  }

  async function toggleStatus(id: string) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    const nextStatus = product.status === 'active' ? 'hidden' : 'active';
    try {
      const updated = await apiJson<Omit<AdminProduct, 'free'> & { isFree?: boolean }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus, isFree: product.free }),
      });
      setProducts((current) => current.map((item) => (item.id === id ? { ...updated, free: Boolean(updated.isFree) } : item)));
    } catch {
      // error handle
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await apiJson(`/products/${deleteId}`, { method: 'DELETE' });
      setProducts((current) => current.filter((product) => product.id !== deleteId));
      setDeleteId(null);
    } catch {
      // error handle
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>إدارة المنتجات</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{products.length} منتج</p>
        </div>
        <button type="button" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--sage)' }}>
          <Plus size={15} /> إضافة منتج
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>جارٍ تحميل المنتجات...</p>}
      {!loading && error && <p className="text-sm" style={{ color: '#B5524A' }}>{error}</p>}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 2px 12px rgba(90,138,128,0.08)', border: '1px solid rgba(127,169,155,0.12)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(127,169,155,0.08)' }}>
              {['#', 'اسم المنتج', 'السعر', 'النوع', 'الحالة', 'إجراءات'].map((h) => (
                <th key={h} className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-dark)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className="border-t" style={{ borderColor: 'rgba(127,169,155,0.08)' }}>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium" style={{ color: 'var(--text-dark)' }}>{p.titleAr}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.titleEn}</p>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{p.free ? 'مجاناً' : p.price}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{TYPE_LABELS[p.type]}</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: p.status === 'active' ? 'rgba(90,138,128,0.12)' : 'rgba(0,0,0,0.06)', color: p.status === 'active' ? 'var(--sage-dark)' : 'var(--text-muted)' }}>
                    {p.status === 'active' ? 'نشط' : 'مخفي'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[var(--cream)]"><Pencil size={14} style={{ color: 'var(--sage-dark)' }} /></button>
                    <button type="button" onClick={() => void toggleStatus(p.id)} className="p-1.5 rounded-lg hover:bg-[var(--cream)]">
                      {p.status === 'active' ? <EyeOff size={14} style={{ color: 'var(--text-muted)' }} /> : <Eye size={14} style={{ color: 'var(--sage)' }} />}
                    </button>
                    <button type="button" onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} style={{ color: '#B5524A' }} /></button>
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
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--cream-dark)' }}>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>{modal.mode === 'add' ? 'إضافة منتج جديد' : 'تعديل المنتج'}</h2>
              <button type="button" onClick={() => setModal(null)}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="اسم المنتج (AR)" value={form.titleAr} onChange={(v) => setForm({ ...form, titleAr: v })} />
                <Field label="اسم المنتج (EN)" value={form.titleEn} onChange={(v) => setForm({ ...form, titleEn: v })} />
              </div>
              {/* 🌟 معالجة الـ Null Check للوصف */}
              <Field label="الوصف" value={form.descAr ?? ''} onChange={(v) => setForm({ ...form, descAr: v })} multiline />
              <div className="grid grid-cols-2 gap-4">
                {/* 🌟 تحويل السعر الصادر من الداتابيز لنص صريح متوافق مع المدخلات */}
                <Field label="السعر" value={String(form.price ?? '')} onChange={(v) => setForm({ ...form, price: v })} />
                {/* 🌟 معالجة الـ Null Check لرابط التحميل */}
                <Field label="رابط التحميل" value={form.downloadUrl ?? ''} onChange={(v) => setForm({ ...form, downloadUrl: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>نوع المنتج</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AdminProduct['type'] })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>الحالة</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AdminProduct['status'] })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}>
                    <option value="active">نشط</option><option value="hidden">مخفي</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.free} onChange={(e) => setForm({ ...form, free: e.target.checked, price: e.target.checked ? 'مجاناً' : form.price })} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-dark)' }}>منتج مجاني</span>
              </label>
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
            <p className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>حذف المنتج؟</p>
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