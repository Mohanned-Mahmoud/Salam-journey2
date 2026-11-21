import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Wand2,
  Image as ImageIcon,
  Check,
  Star,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { apiJson, resolveMediaUrl } from '@/lib/api';
import { R2FileUploader } from '@/components/admin/r2-file-uploader';
import { ProductDetailModal, type ProductModalData } from '@/components/product-detail-modal';
import type { AdminProduct } from './types';

type FormState = {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  detailsAr: string;
  detailsEn: string;
  badgeAr: string;
  badgeEn: string;
  featuresAr: string[];
  featuresEn: string[];
  price: string;
  free: boolean;
  type: AdminProduct['type'];
  downloadUrl: string;
  imageUrl: string;
  images: string[];
  status: AdminProduct['status'];
};

const EMPTY_FORM: FormState = {
  titleAr: '',
  titleEn: '',
  descAr: '',
  descEn: '',
  detailsAr: '',
  detailsEn: '',
  badgeAr: '',
  badgeEn: '',
  featuresAr: [],
  featuresEn: [],
  price: '',
  free: false,
  type: 'pdf',
  downloadUrl: '',
  imageUrl: '',
  images: [],
  status: 'active',
};

const TYPE_LABELS: Record<AdminProduct['type'], string> = {
  pdf: 'PDF كتيب / ملخص',
  printable: 'مطبوعات / أوراق عمل',
  guide: 'دليل شامل',
  other: 'منتج رقمي آخر',
};

export function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [entityId, setEntityId] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [translating, setTranslating] = useState<string | null>(null);

  // New feature input state
  const [newFeatureText, setNewFeatureText] = useState('');
  // New external image URL state
  const [newImageUrl, setNewImageUrl] = useState('');

  // Live preview state
  const [previewProduct, setPreviewProduct] = useState<ProductModalData | null>(null);

  async function handleTranslate(sourceText: string, field: 'titleEn' | 'descEn' | 'detailsEn' | 'badgeEn') {
    if (!sourceText.trim()) return;
    setTranslating(field);
    try {
      const result = await apiJson<{ translatedText: string }>('/translate', {
        method: 'POST',
        body: JSON.stringify({ text: sourceText.trim() }),
      });
      setForm((prev) => ({ ...prev, [field]: result.translatedText }));
    } catch {
      alert('تعذرت الترجمة التلقائية. تأكد من اتصالك بالإنترنت.');
    } finally {
      setTranslating(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        const data = await apiJson<Array<Omit<AdminProduct, 'free'> & { isFree?: boolean }>>('/products');
        if (!cancelled) {
          setProducts(
            data.map((product) => ({
              ...product,
              free: Boolean(product.isFree),
              descEn: product.descEn ?? null,
              images: Array.isArray(product.images) ? product.images : (product.imageUrl ? [product.imageUrl] : []),
              featuresAr: Array.isArray(product.featuresAr) ? product.featuresAr : [],
              featuresEn: Array.isArray(product.featuresEn) ? product.featuresEn : [],
            }))
          );
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

  function openAdd() {
    setEntityId(crypto.randomUUID());
    setForm(EMPTY_FORM);
    setNewFeatureText('');
    setNewImageUrl('');
    setModal({ mode: 'add' });
  }

  function openEdit(p: AdminProduct) {
    setEntityId(p.id);
    const existingImages = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (p.imageUrl ? [p.imageUrl] : []);

    setForm({
      titleAr: p.titleAr,
      titleEn: p.titleEn,
      descAr: p.descAr ?? '',
      descEn: p.descEn ?? '',
      detailsAr: p.detailsAr ?? '',
      detailsEn: p.detailsEn ?? '',
      badgeAr: p.badgeAr ?? '',
      badgeEn: p.badgeEn ?? '',
      featuresAr: Array.isArray(p.featuresAr) ? [...p.featuresAr] : [],
      featuresEn: Array.isArray(p.featuresEn) ? [...p.featuresEn] : [],
      price: p.price ? String(p.price) : '',
      free: p.free,
      type: p.type,
      downloadUrl: p.downloadUrl ?? '',
      imageUrl: p.imageUrl ?? (existingImages[0] || ''),
      images: existingImages,
      status: p.status,
    });
    setNewFeatureText('');
    setNewImageUrl('');
    setModal({ mode: 'edit', id: p.id });
  }

  // Add a feature bullet point
  function addFeature() {
    const trimmed = newFeatureText.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      featuresAr: [...prev.featuresAr, trimmed],
    }));
    setNewFeatureText('');
  }

  function removeFeature(index: number) {
    setForm((prev) => ({
      ...prev,
      featuresAr: prev.featuresAr.filter((_, i) => i !== index),
      featuresEn: prev.featuresEn.filter((_, i) => i !== index),
    }));
  }

  // Add an image to the gallery
  function addImageToGallery(urlOrKey: string) {
    const trimmed = urlOrKey.trim();
    if (!trimmed) return;
    setForm((prev) => {
      const alreadyExists = prev.images.includes(trimmed);
      const nextImages = alreadyExists ? prev.images : [...prev.images, trimmed];
      return {
        ...prev,
        images: nextImages,
        imageUrl: prev.imageUrl ? prev.imageUrl : trimmed,
      };
    });
    setNewImageUrl('');
  }

  function removeImageFromGallery(imgKey: string) {
    setForm((prev) => {
      const nextImages = prev.images.filter((img) => img !== imgKey);
      let nextPrimary = prev.imageUrl;
      if (nextPrimary === imgKey) {
        nextPrimary = nextImages[0] || '';
      }
      return {
        ...prev,
        images: nextImages,
        imageUrl: nextPrimary,
      };
    });
  }

  function setAsPrimaryImage(imgKey: string) {
    setForm((prev) => ({
      ...prev,
      imageUrl: imgKey,
    }));
  }

  async function handleSave() {
    if (!form.titleAr.trim()) {
      alert('يرجى إدخال اسم المنتج بالعربية.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titleAr: form.titleAr.trim(),
        titleEn: form.titleEn.trim() || form.titleAr.trim(),
        descAr: form.descAr.trim() || null,
        descEn: form.descEn.trim() || null,
        detailsAr: form.detailsAr.trim() || null,
        detailsEn: form.detailsEn.trim() || null,
        badgeAr: form.badgeAr.trim() || null,
        badgeEn: form.badgeEn.trim() || null,
        featuresAr: form.featuresAr.filter(Boolean),
        featuresEn: form.featuresEn.filter(Boolean),
        price: form.free ? '0' : (form.price.trim() || '0'),
        isFree: form.free,
        type: form.type,
        downloadUrl: form.downloadUrl.trim() || null,
        imageUrl: form.imageUrl.trim() || (form.images[0] ?? null),
        images: form.images.filter(Boolean),
        status: form.status,
      };

      if (modal?.mode === 'add') {
        const created = await apiJson<Omit<AdminProduct, 'free'> & { isFree?: boolean }>('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setProducts((current) => [
          ...current,
          {
            ...created,
            free: Boolean(created.isFree),
            descEn: created.descEn ?? null,
            images: Array.isArray(created.images) ? created.images : (created.imageUrl ? [created.imageUrl] : []),
            featuresAr: Array.isArray(created.featuresAr) ? created.featuresAr : [],
            featuresEn: Array.isArray(created.featuresEn) ? created.featuresEn : [],
          },
        ]);
      } else if (modal?.id) {
        const updated = await apiJson<Omit<AdminProduct, 'free'> & { isFree?: boolean }>(`/products/${modal.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setProducts((current) =>
          current.map((product) =>
            product.id === modal.id
              ? {
                  ...updated,
                  free: Boolean(updated.isFree),
                  descEn: updated.descEn ?? null,
                  images: Array.isArray(updated.images) ? updated.images : (updated.imageUrl ? [updated.imageUrl] : []),
                  featuresAr: Array.isArray(updated.featuresAr) ? updated.featuresAr : [],
                  featuresEn: Array.isArray(updated.featuresEn) ? updated.featuresEn : [],
                }
              : product
          )
        );
      }
      setModal(null);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ المنتج. يرجى مراجعة المدخلات.');
    } finally {
      setSaving(false);
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
      setProducts((current) =>
        current.map((item) =>
          item.id === id ? { ...updated, free: Boolean(updated.isFree), descEn: updated.descEn ?? null } : item
        )
      );
    } catch {
      alert('تعذر تحديث حالة المنتج');
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await apiJson(`/products/${deleteId}`, { method: 'DELETE' });
      setProducts((current) => current.filter((product) => product.id !== deleteId));
      setDeleteId(null);
    } catch {
      alert('تعذر حذف المنتج');
    }
  }

  // Open Preview Modal from Admin table or form
  function openPreview(prod: AdminProduct | FormState) {
    const isForm = !('id' in prod);
    const id = isForm ? 'preview' : (prod as AdminProduct).id;
    const rawImages = prod.images && prod.images.length > 0
      ? prod.images
      : (prod.imageUrl ? [prod.imageUrl] : []);

    const modalData: ProductModalData = {
      id,
      title: { ar: prod.titleAr || 'اسم المنتج', en: prod.titleEn || prod.titleAr || 'Product Title' },
      desc: { ar: prod.descAr || '', en: prod.descEn || prod.descAr || '' },
      details: { ar: prod.detailsAr || prod.descAr || '', en: prod.detailsEn || prod.descEn || prod.detailsAr || '' },
      features: (prod.featuresAr && prod.featuresAr.length > 0) ? prod.featuresAr : ['محتوى عالي الجودة', 'تحديثات مجانية مستمرة'],
      badge: prod.badgeAr ? { ar: prod.badgeAr, en: prod.badgeEn || prod.badgeAr } : null,
      price: {
        ar: prod.free ? 'مجاناً' : `${prod.price || 0} $`,
        en: prod.free ? 'Free' : `$${prod.price || 0}`,
      },
      rawPrice: Number(prod.price || 0),
      free: Boolean(prod.free),
      type: prod.type,
      imageUrl: prod.imageUrl || rawImages[0] || null,
      images: rawImages,
      downloadUrl: prod.downloadUrl || null,
    };

    setPreviewProduct(modalData);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>
              إدارة المنتجات الرقمية
            </h1>
            <span
              className="px-3 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(90,138,128,0.12)', color: 'var(--sage-dark)' }}
            >
              دعم الصور المتعددة وتفاصيل العرض الدخاني ✨
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {products.length} منتج مسجل في المتجر · تحكم في المعارض، التفاصيل الموسعة، والشارات
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-all"
          style={{ background: 'var(--sage-dark)' }}
        >
          <Plus size={16} /> إضافة منتج جديد
        </button>
      </div>

      {loading && (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">جارٍ تحميل المنتجات...</p>
        </div>
      )}
      {!loading && error && <p className="text-sm" style={{ color: '#B5524A' }}>{error}</p>}

      {/* Products Table */}
      <div
        className="rounded-2xl overflow-hidden shadow-xs"
        style={{
          background: 'white',
          border: '1px solid rgba(127,169,155,0.18)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(127,169,155,0.08)' }}>
                {['#', 'المنتج والغلاف', 'السعر', 'المعرض', 'الشارة', 'النوع', 'الحالة', 'إجراءات'].map((h) => (
                  <th key={h} className="text-right px-4 py-3.5 font-semibold text-xs" style={{ color: 'var(--text-dark)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(127,169,155,0.1)]">
              {products.map((p, i) => {
                const cover = p.imageUrl || p.images?.[0];
                const imagesCount = p.images?.length || (p.imageUrl ? 1 : 0);

                return (
                  <tr key={p.id} className="hover:bg-[rgba(127,169,155,0.03)] transition-colors">
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {i + 1}
                    </td>

                    {/* Product & Cover */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border relative flex items-center justify-center bg-[var(--cream)]"
                          style={{ borderColor: 'rgba(127,169,155,0.2)' }}
                        >
                          {cover ? (
                            <img
                              src={resolveMediaUrl(cover)}
                              alt={p.titleAr}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={18} style={{ color: 'var(--sage)' }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate max-w-xs" style={{ color: 'var(--text-dark)' }}>
                            {p.titleAr}
                          </p>
                          <p className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
                            {p.titleEn}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--sage-dark)' }}>
                      {p.free ? 'مجاناً' : `${p.price} $`}
                    </td>

                    {/* Gallery Count */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(90,138,128,0.1)', color: 'var(--sage-dark)' }}
                      >
                        <Layers size={12} />
                        {imagesCount > 0 ? `${imagesCount} صور` : 'بلا صور'}
                      </span>
                    </td>

                    {/* Badge */}
                    <td className="px-4 py-3">
                      {p.badgeAr ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={{ background: 'rgba(217,119,6,0.12)', color: '#B45309' }}
                        >
                          {p.badgeAr}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-body)' }}>
                      {TYPE_LABELS[p.type] || p.type}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                        style={{
                          background: p.status === 'active' ? 'rgba(90,138,128,0.12)' : 'rgba(0,0,0,0.06)',
                          color: p.status === 'active' ? 'var(--sage-dark)' : 'var(--text-muted)',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: p.status === 'active' ? 'var(--sage-dark)' : '#888' }}
                        />
                        {p.status === 'active' ? 'نشط' : 'مخفي'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Live Preview Button */}
                        <button
                          type="button"
                          title="معاينة البوباب وتفاصيل العرض الدخاني"
                          onClick={() => openPreview(p)}
                          className="p-1.5 rounded-lg hover:bg-[var(--cream)] transition-colors text-xs flex items-center gap-1 px-2 font-medium"
                          style={{ color: 'var(--sage-dark)', border: '1px solid rgba(127,169,155,0.2)' }}
                        >
                          <Eye size={13} /> معاينة
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          title="تعديل المنتج"
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-[var(--cream)] transition-colors"
                        >
                          <Pencil size={14} style={{ color: 'var(--sage-dark)' }} />
                        </button>

                        {/* Toggle Status */}
                        <button
                          type="button"
                          title={p.status === 'active' ? 'إخفاء من الموقع' : 'تفعيل وإظهار'}
                          onClick={() => void toggleStatus(p.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--cream)] transition-colors"
                        >
                          {p.status === 'active' ? (
                            <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />
                          ) : (
                            <Eye size={14} style={{ color: 'var(--sage)' }} />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          title="حذف"
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} style={{ color: '#B5524A' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Comprehensive Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5" style={{ background: 'rgba(30,45,42,0.65)', backdropFilter: 'blur(4px)' }}>
          <div
            className="rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            style={{ background: 'white' }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b shrink-0"
              style={{ borderColor: 'rgba(127,169,155,0.18)', background: 'var(--cream-light)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(90,138,128,0.12)', color: 'var(--sage-dark)' }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>
                    {modal.mode === 'add' ? 'إضافة منتج رقمي جديد' : 'تعديل تفاصيل المنتج والمعرض'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    إعداد الصور المتعددة، التفاصيل الموسعة، والمميزات للشاشة الدخانية
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPreview(form)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'rgba(90,138,128,0.15)', color: 'var(--sage-dark)' }}
                >
                  <Eye size={14} /> معاينة شكل البوباب
                </button>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
                >
                  <X size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* SECTION 1: الأساسيات */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'rgba(127,169,155,0.15)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--sage-dark)' }} />
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>
                    1. المعلومات الأساسية
                  </h3>
                </div>

                {/* Title AR + EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="اسم المنتج (AR) 🇸🇦 *"
                    placeholder="مثال: كتيب خطوات السكينة النفسية"
                    value={form.titleAr}
                    onChange={(v) => setForm({ ...form, titleAr: v })}
                  />
                  <TranslateField
                    label="اسم المنتج (EN) 🇬🇧"
                    placeholder="e.g. Inner Peace Roadmap Guide"
                    value={form.titleEn}
                    onChange={(v) => setForm({ ...form, titleEn: v })}
                    onTranslate={() => void handleTranslate(form.titleAr, 'titleEn')}
                    translating={translating === 'titleEn'}
                    disabled={!form.titleAr.trim()}
                  />
                </div>

                {/* Desc AR + EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="الوصف المختصر (AR) 🇸🇦"
                    placeholder="وصف مختصر يظهر في بطاقة المنتج الرئيسية..."
                    value={form.descAr}
                    onChange={(v) => setForm({ ...form, descAr: v })}
                    multiline
                  />
                  <TranslateField
                    label="الوصف المختصر (EN) 🇬🇧"
                    placeholder="Brief description shown on card..."
                    value={form.descEn}
                    onChange={(v) => setForm({ ...form, descEn: v })}
                    onTranslate={() => void handleTranslate(form.descAr, 'descEn')}
                    translating={translating === 'descEn'}
                    disabled={!form.descAr.trim()}
                    multiline
                  />
                </div>

                {/* Price, Type, Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      السعر (بالدولار $)
                    </label>
                    <input
                      type="text"
                      disabled={form.free}
                      value={form.free ? 'مجاناً' : form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="مثال: 15"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-50"
                      style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.free}
                        onChange={(e) => setForm({ ...form, free: e.target.checked, price: e.target.checked ? '0' : form.price })}
                        className="w-4 h-4 rounded accent-[var(--sage)]"
                      />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-dark)' }}>منتج مجاني</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>نوع المنتج</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as AdminProduct['type'] })}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                    >
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>حالة الظهور</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as AdminProduct['status'] })}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                    >
                      <option value="active">نشط (ظاهر في الموقع)</option>
                      <option value="hidden">مخفي (معطل مؤقتاً)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: معرض الصور المتعددة */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'rgba(127,169,155,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--sage-dark)' }} />
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>
                      2. معرض الصور المتعددة (Product Images Gallery)
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(90,138,128,0.1)', color: 'var(--sage-dark)' }}>
                    {form.images.length} صور في المعرض
                  </span>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  يمكنك إضافة أكثر من صورة لكل منتج. الصورة المعينة كـ <b>"الغلاف الرئيسي"</b> تظهر في بطاقة المنتج وفي البوباب السريع، بينما تظهر بقية الصور كمعرض قابل للتنقل عند النقر على <b>"عرض التفاصيل"</b> مع الانيميشن الدخاني.
                </p>

                {/* Thumbnails grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {form.images.map((imgKey, idx) => {
                    const isPrimary = form.imageUrl === imgKey || (!form.imageUrl && idx === 0);
                    return (
                      <div
                        key={imgKey}
                        className={`group relative rounded-2xl overflow-hidden border p-1.5 flex flex-col justify-between transition-all ${
                          isPrimary ? 'ring-2 ring-[var(--sage)] shadow-sm' : 'border-[rgba(127,169,155,0.25)]'
                        }`}
                        style={{ background: 'var(--cream-light)' }}
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
                          <img
                            src={resolveMediaUrl(imgKey)}
                            alt={`صورة ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Primary Badge */}
                          {isPrimary && (
                            <span
                              className="absolute top-1.5 start-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs flex items-center gap-1"
                              style={{ background: 'var(--sage-dark)' }}
                            >
                              <Star size={10} className="fill-white" /> الغلاف
                            </span>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => removeImageFromGallery(imgKey)}
                            title="حذف من المعرض"
                            className="absolute top-1.5 end-1.5 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Set primary action */}
                        <div className="pt-2 text-center">
                          {!isPrimary ? (
                            <button
                              type="button"
                              onClick={() => setAsPrimaryImage(imgKey)}
                              className="w-full text-[11px] font-semibold py-1 rounded-lg transition-colors hover:bg-white"
                              style={{ color: 'var(--sage-dark)', border: '1px solid rgba(127,169,155,0.3)' }}
                            >
                              تعيين كغلاف
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold flex items-center justify-center gap-1" style={{ color: 'var(--sage-dark)' }}>
                              <Check size={12} /> الغلاف الحالي
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {form.images.length === 0 && (
                    <div
                      className="col-span-full py-8 text-center rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
                      style={{ borderColor: 'rgba(127,169,155,0.25)', background: 'var(--cream-light)' }}
                    >
                      <ImageIcon size={28} style={{ color: 'var(--sage)' }} />
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-dark)' }}>
                        لا توجد صور في المعرض حالياً
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        ارفع صورة عبر الزر أدناه أو أدخل رابط صورة خارجي
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload & Add Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl border" style={{ borderColor: 'rgba(127,169,155,0.2)', background: 'white' }}>
                    <R2FileUploader
                      entityId={entityId}
                      entityType="products"
                      onUploaded={(key) => addImageToGallery(key)}
                      label="رفع صورة جديدة إلى المعرض (R2)"
                      accept="image/*"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border flex flex-col justify-between" style={{ borderColor: 'rgba(127,169,155,0.2)', background: 'white' }}>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                        أو أضف رابط صورة مباشر (URL / Key)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="https://... أو products/..."
                          className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                          style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                        />
                        <button
                          type="button"
                          onClick={() => addImageToGallery(newImageUrl)}
                          disabled={!newImageUrl.trim()}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                          style={{ background: 'var(--sage-dark)' }}
                        >
                          إضافة
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                      سيتم إدراج الصورة فوراً في شريط الصور للمعرض.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: الشارات والتفاصيل الموسعة والمميزات */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'rgba(127,169,155,0.15)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--sage-dark)' }} />
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>
                    3. الشارات، التفاصيل الموسعة، وقائمة المميزات
                  </h3>
                </div>

                {/* Badge AR + EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="شارة مميزة (AR) 🇸🇦"
                    placeholder="مثال: الأكثر طلباً · إصدار حصري · جديد"
                    value={form.badgeAr}
                    onChange={(v) => setForm({ ...form, badgeAr: v })}
                  />
                  <TranslateField
                    label="شارة مميزة (EN) 🇬🇧"
                    placeholder="e.g. Best Seller · Exclusive"
                    value={form.badgeEn}
                    onChange={(v) => setForm({ ...form, badgeEn: v })}
                    onTranslate={() => void handleTranslate(form.badgeAr, 'badgeEn')}
                    translating={translating === 'badgeEn'}
                    disabled={!form.badgeAr.trim()}
                  />
                </div>

                {/* Extended Details AR + EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="التفاصيل الموسعة للشاشة الدخانية (AR) 🇸🇦"
                    placeholder="شرح متكامل وموسع عن المنتج، محاوره، وكيفية الاستفادة منه يظهر في النصف الأيسر للشاشة..."
                    value={form.detailsAr}
                    onChange={(v) => setForm({ ...form, detailsAr: v })}
                    multiline
                  />
                  <TranslateField
                    label="التفاصيل الموسعة (EN) 🇬🇧"
                    placeholder="In-depth details shown on the left half of the split modal..."
                    value={form.detailsEn}
                    onChange={(v) => setForm({ ...form, detailsEn: v })}
                    onTranslate={() => void handleTranslate(form.detailsAr, 'detailsEn')}
                    translating={translating === 'detailsEn'}
                    disabled={!form.detailsAr.trim()}
                    multiline
                  />
                </div>

                {/* Features Highlights List */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>
                    قائمة ما يحتويه المنتج / المميزات (تظهر بنقاط مضيئة في البوباب)
                  </label>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                      placeholder="أضف ميزة جديدة (مثال: ملخص تطبيقي من 45 صفحة) واضغط إضافة..."
                      className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                      style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      disabled={!newFeatureText.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 flex items-center gap-1"
                      style={{ background: 'var(--sage-dark)' }}
                    >
                      <Plus size={14} /> إضافة ميزة
                    </button>
                  </div>

                  {form.featuresAr.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {form.featuresAr.map((feat, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                          style={{ background: 'rgba(90,138,128,0.1)', color: 'var(--sage-dark)' }}
                        >
                          <Check size={12} />
                          <span>{feat}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(idx)}
                            className="hover:text-red-600 transition-colors ms-1 p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      لم تُضف ميزات بعد. إذا لم تضف، سيتم استخدام ميزات افتراضية راقية تلقائياً.
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION 4: ملف التنزيل (Downloadable Asset) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'rgba(127,169,155,0.15)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--sage-dark)' }} />
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>
                    4. ملف المنتج للتحميل الفوري
                  </h3>
                </div>

                <div className="p-4 rounded-2xl border" style={{ borderColor: 'rgba(127,169,155,0.2)', background: 'white' }}>
                  <R2FileUploader
                    entityId={entityId}
                    entityType="products"
                    currentFileKey={form.downloadUrl || null}
                    onUploaded={(key) => setForm((f) => ({ ...f, downloadUrl: key }))}
                    label="ملف المنتج الأساسي (PDF / كتيب / ملف مضغوط) - رفع إلى R2"
                    accept=".pdf,video/*,image/*,application/*"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              className="flex items-center justify-between gap-3 px-6 py-4 border-t shrink-0"
              style={{ borderColor: 'rgba(127,169,155,0.18)', background: 'var(--cream-light)' }}
            >
              <button
                type="button"
                onClick={() => openPreview(form)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'white', border: '1px solid rgba(127,169,155,0.3)', color: 'var(--sage-dark)' }}
              >
                <Eye size={15} /> معاينة شكل البوباب الآن
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: 'transparent', color: 'var(--text-muted)' }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm disabled:opacity-50 transition-all"
                  style={{ background: 'var(--sage-dark)' }}
                >
                  {saving ? 'جارٍ الحفظ...' : 'حفظ المنتج'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,74,69,0.5)' }}>
          <div className="rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-xl" style={{ background: 'white' }}>
            <p className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>حذف هذا المنتج نهائياً؟</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              سيتم حذف المنتج من المتجر وقاعدة البيانات. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-xs"
                style={{ background: '#B5524A' }}
              >
                تأكيد الحذف
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--cream)', color: 'var(--text-dark)' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal for Admin */}
      <ProductDetailModal
        isOpen={Boolean(previewProduct)}
        onClose={() => setPreviewProduct(null)}
        product={previewProduct}
        onBuy={() => alert('هذه معاينة تجريبية لشكل البوباب في لوحة الإدارة.')}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors';
  const style = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cls}
          style={{ ...style, resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
          style={style}
        />
      )}
    </div>
  );
}

function TranslateField({
  label,
  value,
  onChange,
  onTranslate,
  translating,
  disabled,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onTranslate: () => void;
  translating: boolean;
  disabled: boolean;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors';
  const style = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold" style={{ color: 'var(--text-dark)' }}>
          {label}
        </label>
        <button
          type="button"
          onClick={onTranslate}
          disabled={translating || disabled}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{ background: 'rgba(127,169,155,0.15)', color: 'var(--sage-dark)' }}
        >
          <Wand2 size={11} />
          {translating ? 'جارٍ الترجمة...' : 'ترجمة تلقائية ✨'}
        </button>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cls}
          style={{ ...style, resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
          style={style}
        />
      )}
    </div>
  );
}
