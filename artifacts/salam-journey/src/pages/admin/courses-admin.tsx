import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Sparkles,
  ListPlus,
  Wand2,
  Image as ImageIcon,
  Check,
  Star,
  Layers,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Video,
  Play,
  FileText,
  Lock,
} from 'lucide-react';
import { apiJson, resolveMediaUrl } from '@/lib/api';
import { R2FileUploader } from '@/components/admin/r2-file-uploader';
import { CourseDetailModal, type CourseModalData } from '@/components/course-detail-modal';
import type { AdminCourse } from './types';

export interface CourseLesson {
  id: string;
  titleAr: string;
  titleEn?: string;
  duration?: string;
  videoUrl: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isFreePreview?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
}

type FormState = {
  coachId: string;
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
  category: AdminCourse['category'];
  price: number | string;
  duration: number;
  durationUnit: string;
  students: string;
  status: AdminCourse['status'];
  gradient: string;
  imageUrl: string;
  images: string[];
  videoUrl: string;
  lessons: CourseLesson[];
};

const EMPTY_FORM: FormState = {
  coachId: '00000000-0000-0000-0000-000000000000',
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
  category: 'course',
  price: 0,
  duration: 0,
  durationUnit: 'weeks',
  students: '0',
  status: 'active',
  gradient: 'linear-gradient(135deg, var(--sage-dark), var(--sage))',
  imageUrl: '',
  images: [],
  videoUrl: '',
  lessons: [],
};

const CATEGORY_LABELS: Record<AdminCourse['category'], string> = {
  course: 'دورة مسجّلة',
  workshop: 'ورشة مباشرة',
  free: 'مجاناً',
};

export function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [entityId, setEntityId] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [translating, setTranslating] = useState<string | null>(null);

  // New feature & image input states
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Lesson manager sub-state
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState<CourseLesson>({
    id: '',
    titleAr: '',
    titleEn: '',
    duration: '',
    videoUrl: '',
    descriptionAr: '',
    descriptionEn: '',
    isFreePreview: false,
    attachmentUrl: '',
    attachmentName: '',
  });
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');

  // Live preview modal state
  const [previewCourse, setPreviewCourse] = useState<CourseModalData | null>(null);

  // Featured section state
  const [featuredMode, setFeaturedMode] = useState('most_loved');
  const [featuredCourseId, setFeaturedCourseId] = useState('');
  const [upcomingCourseId, setUpcomingCourseId] = useState('');
  const [savingFeatured, setSavingFeatured] = useState(false);

  const [f1Ar, setF1Ar] = useState('١٢ درس فيديو عالي الجودة');
  const [f1En, setF1En] = useState('12 high-quality video lessons');
  const [f2Ar, setF2Ar] = useState('ملفات عمل قابلة للتحميل');
  const [f2En, setF2En] = useState('Downloadable workbooks');
  const [f3Ar, setF3Ar] = useState('جلسات أسئلة وأجوبة شهرية');
  const [f3En, setF3En] = useState('Monthly Q&A sessions');
  const [f4Ar, setF4Ar] = useState('مجتمع خاص للأمهات');
  const [f4En, setF4En] = useState("A private mothers' community");

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
    async function loadAllData() {
      try {
        setLoading(true);

        const [
          coursesData,
          coachesData,
          modeRes,
          featuredRes,
          upcomingRes,
          feat1Ar,
          feat1En,
          feat2Ar,
          feat2En,
          feat3Ar,
          feat3En,
          feat4Ar,
          feat4En,
        ] = await Promise.all([
          apiJson<any[]>('/courses'),
          apiJson<any>('/coaches').catch(() => []),
          apiJson<{ value: string }>('/site-settings/featured_course_mode').catch(() => ({ value: 'most_loved' })),
          apiJson<{ value: string }>('/site-settings/featured_course_id').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/site-settings/upcoming_course_id').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/site-settings/featured_feature_1_ar').catch(() => ({ value: '١٢ درس فيديو عالي الجودة' })),
          apiJson<{ value: string }>('/site-settings/featured_feature_1_en').catch(() => ({ value: '12 high-quality video lessons' })),
          apiJson<{ value: string }>('/site-settings/featured_feature_2_ar').catch(() => ({ value: 'ملفات عمل قابلة للتحميل' })),
          apiJson<{ value: string }>('/site-settings/featured_feature_2_en').catch(() => ({ value: 'Downloadable workbooks' })),
          apiJson<{ value: string }>('/site-settings/featured_feature_3_ar').catch(() => ({ value: 'جلسات أسئلة وأجوبة شهرية' })),
          apiJson<{ value: string }>('/site-settings/featured_feature_3_en').catch(() => ({ value: 'Monthly Q&A sessions' })),
          apiJson<{ value: string }>('/site-settings/featured_feature_4_ar').catch(() => ({ value: 'مجتمع خاص للأمهات' })),
          apiJson<{ value: string }>('/site-settings/featured_feature_4_en').catch(() => ({ value: "A private mothers' community" })),
        ]);

        if (!cancelled) {
          setCourses(
            coursesData.map((c) => ({
              ...c,
              images: Array.isArray(c.images) ? c.images : (c.imageUrl || c.image_url ? [c.imageUrl || c.image_url] : []),
              featuresAr: Array.isArray(c.featuresAr || c.features_ar) ? (c.featuresAr || c.features_ar) : [],
              featuresEn: Array.isArray(c.featuresEn || c.features_en) ? (c.featuresEn || c.features_en) : [],
            }))
          );
          const extractedCoaches = Array.isArray(coachesData) ? coachesData : coachesData?.coaches || coachesData?.data || [];
          setCoaches(extractedCoaches);

          setFeaturedMode(modeRes?.value || 'most_loved');
          setFeaturedCourseId(featuredRes?.value || '');
          setUpcomingCourseId(upcomingRes?.value || '');

          setF1Ar(feat1Ar?.value || '١٢ درس فيديو عالي الجودة');
          setF1En(feat1En?.value || '12 high-quality video lessons');
          setF2Ar(feat2Ar?.value || 'ملفات عمل قابلة للتحميل');
          setF2En(feat2En?.value || 'Downloadable workbooks');
          setF3Ar(feat3Ar?.value || 'جلسات أسئلة وأجوبة شهرية');
          setF3En(feat3En?.value || 'Monthly Q&A sessions');
          setF4Ar(feat4Ar?.value || 'مجتمع خاص للأمهات');
          setF4En(feat4En?.value || "A private mothers' community");
        }
      } catch {
        if (!cancelled) setError('تعذر تحميل البيانات من قاعدة البيانات');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAllData();
    return () => {
      cancelled = true;
    };
  }, []);

  function openAdd() {
    setEntityId(crypto.randomUUID());
    setForm({
      ...EMPTY_FORM,
      coachId: coaches.length > 0 ? coaches[0].id : EMPTY_FORM.coachId,
    });
    setNewFeatureText('');
    setNewImageUrl('');
    setModal({ mode: 'add' });
  }

  function openEdit(c: any) {
    setEntityId(c.id);
    const existingImages = Array.isArray(c.images) && c.images.length > 0
      ? c.images
      : (c.imageUrl || c.image_url ? [c.imageUrl || c.image_url] : []);

    setForm({
      coachId: c.coachId || c.coach_id,
      titleAr: c.titleAr || c.title_ar,
      titleEn: c.titleEn || c.title_en,
      descAr: c.descAr || c.desc_ar || '',
      descEn: c.descEn || c.desc_en || '',
      detailsAr: c.detailsAr || c.details_ar || '',
      detailsEn: c.detailsEn || c.details_en || '',
      badgeAr: c.badgeAr || c.badge_ar || '',
      badgeEn: c.badgeEn || c.badge_en || '',
      featuresAr: Array.isArray(c.featuresAr || c.features_ar) ? [...(c.featuresAr || c.features_ar)] : [],
      featuresEn: Array.isArray(c.featuresEn || c.features_en) ? [...(c.featuresEn || c.features_en)] : [],
      category: c.category,
      price: c.price ?? 0,
      duration: c.duration ?? 0,
      students: c.students ?? '0',
      status: c.status,
      gradient: c.gradient ?? 'linear-gradient(135deg, var(--sage-dark), var(--sage))',
      imageUrl: c.imageUrl || c.image_url || (existingImages[0] || ''),
      images: existingImages,
      videoUrl: c.videoUrl || c.video_url || '',
      durationUnit: c.durationUnit || c.duration_unit || 'weeks',
      lessons: Array.isArray(c.lessons) ? [...c.lessons] : [],
    });
    setNewFeatureText('');
    setNewImageUrl('');
    setModal({ mode: 'edit', id: c.id });
  }

  // Lesson helper functions
  function openAddLesson() {
    setLessonForm({
      id: crypto.randomUUID(),
      titleAr: '',
      titleEn: '',
      duration: '',
      videoUrl: '',
      descriptionAr: '',
      descriptionEn: '',
      isFreePreview: form.lessons.length === 0,
      attachmentUrl: '',
      attachmentName: '',
    });
    setNewLessonVideoUrl('');
    setEditingLessonIndex(null);
    setShowLessonDialog(true);
  }

  function openEditLesson(index: number) {
    const l = form.lessons[index];
    if (!l) return;
    setLessonForm({ ...l });
    setNewLessonVideoUrl(l.videoUrl || '');
    setEditingLessonIndex(index);
    setShowLessonDialog(true);
  }

  function saveLesson() {
    if (!lessonForm.titleAr.trim()) {
      alert('يرجى إدخال عنوان الدرس بالعربية');
      return;
    }
    const finalVideo = newLessonVideoUrl.trim() || lessonForm.videoUrl;
    const finalLesson: CourseLesson = {
      ...lessonForm,
      id: lessonForm.id || crypto.randomUUID(),
      titleAr: lessonForm.titleAr.trim(),
      videoUrl: finalVideo,
    };

    setForm((prev) => {
      const next = [...prev.lessons];
      if (editingLessonIndex !== null && editingLessonIndex >= 0) {
        next[editingLessonIndex] = finalLesson;
      } else {
        next.push(finalLesson);
      }
      return { ...prev, lessons: next };
    });
    setShowLessonDialog(false);
    setEditingLessonIndex(null);
  }

  function removeLesson(index: number) {
    if (!confirm('هل أنتِ متأكدة من حذف هذا الدرس من الدورة؟')) return;
    setForm((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== index),
    }));
  }

  function moveLesson(index: number, direction: 'up' | 'down') {
    setForm((prev) => {
      const next = [...prev.lessons];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return { ...prev, lessons: next };
    });
  }

  // Feature bullet points
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

  // Gallery images
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
      alert('يرجى إدخال اسم الدورة بالعربية.');
      return;
    }

    setSaving(true);
    let finalCoachId = form.coachId;
    if ((!finalCoachId || finalCoachId === '00000000-0000-0000-0000-000000000000') && coaches.length > 0) {
      finalCoachId = coaches[0].id;
    }

    const cleanPayload = {
      coachId: finalCoachId,
      titleAr: form.titleAr.trim(),
      titleEn: form.titleEn.trim() || form.titleAr.trim(),
      descAr: form.descAr ? form.descAr.trim() : null,
      descEn: form.descEn ? form.descEn.trim() : null,
      detailsAr: form.detailsAr ? form.detailsAr.trim() : null,
      detailsEn: form.detailsEn ? form.detailsEn.trim() : null,
      badgeAr: form.badgeAr ? form.badgeAr.trim() : null,
      badgeEn: form.badgeEn ? form.badgeEn.trim() : null,
      featuresAr: form.featuresAr.filter(Boolean),
      featuresEn: form.featuresEn.filter(Boolean),
      category: form.category,
      price: String(form.price || 0),
      duration: Number(form.duration) || 0,
      students: String(form.students || '0'),
      status: form.status,
      gradient: form.gradient,
      imageUrl: form.imageUrl ? form.imageUrl.trim() : (form.images[0] || null),
      images: form.images.filter(Boolean),
      videoUrl: form.videoUrl ? form.videoUrl.trim() : null,
      durationUnit: form.durationUnit || 'weeks',
      lessons: Array.isArray(form.lessons) ? form.lessons : [],
    };

    try {
      if (modal?.mode === 'add') {
        const created = await apiJson<any>('/courses', { method: 'POST', body: JSON.stringify(cleanPayload) });
        setCourses((current) => [
          ...current,
          {
            ...created,
            images: Array.isArray(created.images) ? created.images : (created.imageUrl ? [created.imageUrl] : []),
            featuresAr: Array.isArray(created.featuresAr) ? created.featuresAr : [],
            featuresEn: Array.isArray(created.featuresEn) ? created.featuresEn : [],
            lessons: Array.isArray(created.lessons) ? created.lessons : form.lessons,
          },
        ]);
      } else if (modal?.id) {
        const updated = await apiJson<any>(`/courses/${modal.id}`, { method: 'PUT', body: JSON.stringify(cleanPayload) });
        setCourses((current) =>
          current.map((course) =>
            course.id === modal.id
              ? {
                  ...updated,
                  images: Array.isArray(updated.images) ? updated.images : (updated.imageUrl ? [updated.imageUrl] : []),
                  featuresAr: Array.isArray(updated.featuresAr) ? updated.featuresAr : [],
                  featuresEn: Array.isArray(updated.featuresEn) ? updated.featuresEn : [],
                  lessons: Array.isArray(updated.lessons) ? updated.lessons : form.lessons,
                }
              : course
          )
        );
      }
      setModal(null);
    } catch (err: any) {
      alert(`فشل الحفظ: ${err?.message || 'تأكد من البيانات'}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFeatured() {
    try {
      setSavingFeatured(true);
      await Promise.all([
        apiJson('/admin/site-settings/featured_course_mode', { method: 'PUT', body: JSON.stringify({ value: featuredMode }) }),
        apiJson('/admin/site-settings/featured_course_id', { method: 'PUT', body: JSON.stringify({ value: featuredCourseId }) }),
        apiJson('/admin/site-settings/upcoming_course_id', { method: 'PUT', body: JSON.stringify({ value: upcomingCourseId }) }),

        apiJson('/admin/site-settings/featured_feature_1_ar', { method: 'PUT', body: JSON.stringify({ value: f1Ar }) }),
        apiJson('/admin/site-settings/featured_feature_1_en', { method: 'PUT', body: JSON.stringify({ value: f1En }) }),
        apiJson('/admin/site-settings/featured_feature_2_ar', { method: 'PUT', body: JSON.stringify({ value: f2Ar }) }),
        apiJson('/admin/site-settings/featured_feature_2_en', { method: 'PUT', body: JSON.stringify({ value: f2En }) }),
        apiJson('/admin/site-settings/featured_feature_3_ar', { method: 'PUT', body: JSON.stringify({ value: f3Ar }) }),
        apiJson('/admin/site-settings/featured_feature_3_en', { method: 'PUT', body: JSON.stringify({ value: f3En }) }),
        apiJson('/admin/site-settings/featured_feature_4_ar', { method: 'PUT', body: JSON.stringify({ value: f4Ar }) }),
        apiJson('/admin/site-settings/featured_feature_4_en', { method: 'PUT', body: JSON.stringify({ value: f4En }) }),
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
      setCourses((current) => current.map((item) => (item.id === id ? { ...item, ...updated, status: nextStatus } : item)));
    } catch {
      alert('تعذر تحديث حالة الدورة');
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await apiJson(`/courses/${deleteId}`, { method: 'DELETE' });
      setCourses((current) => current.filter((course) => course.id !== deleteId));
      setDeleteId(null);
    } catch {
      alert('تعذر حذف الدورة');
    }
  }

  // Open Preview Modal from Table or Form
  function openPreview(c: any) {
    const isForm = !c.id;
    const rawImages = c.images && c.images.length > 0
      ? c.images
      : (c.imageUrl || c.image_url ? [c.imageUrl || c.image_url] : []);

    const durationUnit = c.durationUnit || c.duration_unit || 'weeks';
    const durVal = c.duration || 0;
    const durStr = durationUnit === 'minutes' ? `${durVal} دقيقة` : `${durVal} أسابيع`;

    const modalData: CourseModalData = {
      id: isForm ? 'preview' : c.id,
      title: { ar: c.titleAr || c.title_ar || 'اسم الدورة', en: c.titleEn || c.title_en || 'Course' },
      desc: { ar: c.descAr || c.desc_ar || '', en: c.descEn || c.desc_en || '' },
      details: { ar: c.detailsAr || c.details_ar || c.descAr || '', en: c.detailsEn || c.details_en || '' },
      category: c.category || 'course',
      duration: { ar: durStr, en: `${durVal} ${durationUnit}` },
      students: String(c.students || '0'),
      features: (c.featuresAr && c.featuresAr.length > 0) ? c.featuresAr : ['تسجيل كامل عالي الجودة', 'شهادة إتمام معتمدة'],
      badge: (c.badgeAr || c.badge_ar) ? { ar: c.badgeAr || c.badge_ar, en: c.badgeEn || c.badge_en || '' } : null,
      price: {
        ar: String(c.price) === '0' || c.category === 'free' ? 'مجاناً' : `${c.price} $`,
        en: String(c.price) === '0' || c.category === 'free' ? 'Free' : `$${c.price}`,
      },
      rawPrice: Number(c.price || 0),
      free: String(c.price) === '0' || c.category === 'free',
      imageUrl: c.imageUrl || c.image_url || rawImages[0] || null,
      images: rawImages,
      gradient: c.gradient || 'linear-gradient(135deg, var(--sage-dark), var(--sage))',
      videoUrl: c.videoUrl || c.video_url || null,
      lessons: (form.lessons && form.lessons.length > 0) ? form.lessons : (Array.isArray(c.lessons) ? c.lessons : []),
    };

    setPreviewCourse(modalData);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>
              إدارة الدورات والورش التدريبية
            </h1>
            <span
              className="px-3 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(90,138,128,0.12)', color: 'var(--sage-dark)' }}
            >
              دعم معرض الصور وتفاصيل العرض الموسعة ✨
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {courses.length} دورة وورشة تدريبية · تحكم في المعارض، المحاور، والشارات
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-all"
          style={{ background: 'var(--sage-dark)' }}
        >
          <Plus size={16} /> إضافة دورة جديدة
        </button>
      </div>

      {loading && (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">جارٍ تحميل الدورات...</p>
        </div>
      )}
      {!loading && error && <p className="text-sm" style={{ color: '#B5524A' }}>{error}</p>}

      {/* Courses Table */}
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
                {['#', 'الدورة والغلاف', 'السعر', 'المعرض', 'الشارة', 'النوع', 'الطلاب', 'الحالة', 'إجراءات'].map((h) => (
                  <th key={h} className="text-right px-4 py-3.5 font-semibold text-xs" style={{ color: 'var(--text-dark)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(127,169,155,0.1)]">
              {courses.map((c, i) => {
                const cover = c.imageUrl || c.image_url || c.images?.[0];
                const imagesCount = c.images?.length || (cover ? 1 : 0);

                return (
                  <tr key={c.id} className="hover:bg-[rgba(127,169,155,0.03)] transition-colors">
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {i + 1}
                    </td>

                    {/* Course & Cover */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border relative flex items-center justify-center bg-[var(--cream)]"
                          style={{ borderColor: 'rgba(127,169,155,0.2)' }}
                        >
                          {cover ? (
                            <img
                              src={resolveMediaUrl(cover)}
                              alt={c.titleAr || c.title_ar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white" style={{ background: c.gradient || 'var(--sage)' }}>
                              <BookOpen size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate max-w-xs" style={{ color: 'var(--text-dark)' }}>
                            {c.titleAr || c.title_ar}
                          </p>
                          <p className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
                            {c.titleEn || c.title_en}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--sage-dark)' }}>
                      {String(c.price) === '0' || c.category === 'free' ? 'مجاناً' : `${c.price} $`}
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
                      {c.badgeAr || c.badge_ar ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={{ background: 'rgba(217,119,6,0.12)', color: '#B45309' }}
                        >
                          {c.badgeAr || c.badge_ar}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-body)' }}>
                      {CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category}
                    </td>

                    {/* Students */}
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {c.students || '0'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                        style={{
                          background: c.status === 'active' ? 'rgba(90,138,128,0.12)' : 'rgba(0,0,0,0.06)',
                          color: c.status === 'active' ? 'var(--sage-dark)' : 'var(--text-muted)',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: c.status === 'active' ? 'var(--sage-dark)' : '#888' }}
                        />
                        {c.status === 'active' ? 'نشط' : 'مخفي'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Live Preview Button */}
                        <button
                          type="button"
                          title="معاينة شكل البوباب والشاشة المقسمة"
                          onClick={() => openPreview(c)}
                          className="p-1.5 rounded-lg hover:bg-[var(--cream)] transition-colors text-xs flex items-center gap-1 px-2 font-medium"
                          style={{ color: 'var(--sage-dark)', border: '1px solid rgba(127,169,155,0.2)' }}
                        >
                          <Eye size={13} /> معاينة
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          title="تعديل الدورة"
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-[var(--cream)] transition-colors"
                        >
                          <Pencil size={14} style={{ color: 'var(--sage-dark)' }} />
                        </button>

                        {/* Toggle Status */}
                        <button
                          type="button"
                          title={c.status === 'active' ? 'إخفاء من الموقع' : 'تفعيل وإظهار'}
                          onClick={() => void toggleStatus(c.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--cream)] transition-colors"
                        >
                          {c.status === 'active' ? (
                            <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />
                          ) : (
                            <Eye size={14} style={{ color: 'var(--sage)' }} />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          title="حذف"
                          onClick={() => setDeleteId(c.id)}
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

      {/* Featured Section Settings (Preserved exactly as existing) */}
      {!loading && (
        <div
          className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-xs"
          style={{ background: 'white', border: '1px solid rgba(127,169,155,0.18)' }}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-bold" style={{ color: 'var(--text-dark)' }}>
              <Sparkles size={18} style={{ color: 'var(--sage)' }} />
              <h2>خيارات العرض والكورسات البارزة</h2>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>
                نوع العرض الحركي حالياً:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFeaturedMode('most_loved')}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: featuredMode === 'most_loved' ? 'var(--sage-dark)' : 'var(--cream)',
                    color: featuredMode === 'most_loved' ? 'white' : 'var(--text-body)',
                  }}
                >
                  🔥 الأكثر طلباً
                </button>
                <button
                  type="button"
                  onClick={() => setFeaturedMode('upcoming')}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: featuredMode === 'upcoming' ? 'var(--sage-dark)' : 'var(--cream)',
                    color: featuredMode === 'upcoming' ? 'white' : 'var(--text-body)',
                  }}
                >
                  ⏳ قادمة قريباً
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>
                كورس الأكثر طلباً:
              </label>
              <select
                value={featuredCourseId}
                onChange={(e) => setFeaturedCourseId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)' }}
              >
                <option value="">-- اختر دورة --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleAr || c.title_ar}
                    {c.status === 'hidden' ? ' (مخفية)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>
                كورس قادمة قريباً:
              </label>
              <select
                value={upcomingCourseId}
                onChange={(e) => setUpcomingCourseId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)' }}
              >
                <option value="">-- اختر دورة --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleAr || c.title_ar}
                    {c.status === 'hidden' ? ' (مخفية)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
            <div className="flex items-center gap-2 text-base font-bold mb-1" style={{ color: 'var(--text-dark)' }}>
              <ListPlus size={18} style={{ color: 'var(--sage)' }} />
              <h2>نقاط ومميزات السكشن البارز (باللغتين)</h2>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 space-y-2">
              <FormField label="الميزة الأولى (عربي)" value={f1Ar} onChange={setF1Ar} />
              <FormField label="الميزة الأولى (English)" value={f1En} onChange={setF1En} />
            </div>

            <div className="p-3 rounded-xl border border-gray-100 space-y-2">
              <FormField label="الميزة الثانية (عربي)" value={f2Ar} onChange={setF2Ar} />
              <FormField label="الميزة الثانية (English)" value={f2En} onChange={setF2En} />
            </div>

            <div className="p-3 rounded-xl border border-gray-100 space-y-2">
              <FormField label="الميزة الثالثة (عربي)" value={f3Ar} onChange={setF3Ar} />
              <FormField label="الميزة الثالثة (English)" value={f3En} onChange={setF3En} />
            </div>

            <div className="p-3 rounded-xl border border-gray-100 space-y-2">
              <FormField label="الميزة الرابعة (عربي)" value={f4Ar} onChange={setF4Ar} />
              <FormField label="الميزة الرابعة (English)" value={f4En} onChange={setF4En} />
            </div>

            <button
              type="button"
              onClick={handleSaveFeatured}
              disabled={savingFeatured}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'var(--sage-dark)' }}
            >
              {savingFeatured ? 'جاري الحفظ...' : 'حفظ إعدادات ومميزات السكشن كاملة'}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Comprehensive Course Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
          style={{ background: 'rgba(30,45,42,0.65)', backdropFilter: 'blur(4px)' }}
        >
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
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>
                    {modal.mode === 'add' ? 'إضافة دورة تدريبية جديدة' : 'تعديل بيانات الدورة والمعرض'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    إعداد الصور المتعددة، التفاصيل الموسعة، والمحاور للشاشة المقسمة
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
                    1. المعلومات الأساسية والمدرب
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                    المدرب المسؤول عن الدورة
                  </label>
                  <select
                    value={form.coachId}
                    onChange={(e) => setForm({ ...form, coachId: e.target.value })}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                  >
                    {coaches.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.nameAr || ch.name || ch.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title AR + EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="اسم الدورة (AR) 🇸🇦 *"
                    placeholder="مثال: وأصبحتُ أُمّاً هادئة"
                    value={form.titleAr}
                    onChange={(v) => setForm({ ...form, titleAr: v })}
                  />
                  <TranslateField
                    label="اسم الدورة (EN) 🇬🇧"
                    placeholder="e.g. Becoming a Calm Mother"
                    value={form.titleEn}
                    onChange={(v) => setForm({ ...form, titleEn: v })}
                    onTranslate={() => void handleTranslate(form.titleAr, 'titleEn')}
                    translating={translating === 'titleEn'}
                    disabled={!form.titleAr.trim()}
                  />
                </div>

                {/* Desc AR + EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="الوصف المختصر (AR) 🇸🇦"
                    placeholder="وصف مختصر يظهر في بطاقة الدورة في الشبكة..."
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

                {/* Price, Category, Duration, Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      السعر (بالدولار $)
                    </label>
                    <input
                      type="text"
                      value={String(form.price)}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0 للدورات المجانية"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      نوع الدورة
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as AdminCourse['category'] })}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      المدة والوحدة
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={form.duration || ''}
                        onChange={(e) => setForm({ ...form, duration: Number(e.target.value) || 0 })}
                        placeholder="6"
                        className="w-1/2 rounded-xl px-2 py-2.5 text-sm outline-none"
                        style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                      />
                      <select
                        value={form.durationUnit || 'weeks'}
                        onChange={(e) => setForm({ ...form, durationUnit: e.target.value })}
                        className="w-1/2 rounded-xl px-2 py-2.5 text-xs outline-none"
                        style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                      >
                        <option value="weeks">أسابيع</option>
                        <option value="minutes">دقائق</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      الحالة
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as AdminCourse['status'] })}
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
                      2. معرض صور الدورة والمحاور (Course Images Gallery)
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(90,138,128,0.1)', color: 'var(--sage-dark)' }}>
                    {form.images.length} صور في المعرض
                  </span>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  يمكنك إضافة أكثر من صورة لكل دورة (مثل: بوستر الدورة، نموذج الشهادة، محاور الدروس، صور الجلسات). الصورة المعينة كـ <b>"الغلاف الرئيسي"</b> تظهر في بطاقة الدورة في الشبكة، بينما تظهر جميع الصور كمعرض قابل للتنقل عند النقر على <b>"عرض التفاصيل"</b>.
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
                      entityType="courses"
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
                          placeholder="https://... أو courses/..."
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
                      سيتم إدراج الصورة فوراً في شريط المعرض.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: الشارات والتفاصيل الموسعة والمحاور */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'rgba(127,169,155,0.15)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--sage-dark)' }} />
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>
                    3. الشارات، التفاصيل الموسعة، ومحاور الدورة
                  </h3>
                </div>

                {/* Badge AR + EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="شارة مميزة (AR) 🇸🇦"
                    placeholder="مثال: الأكثر تسجيلاً ⭐ · مباشر عبر زووم · مقاعد محدودة"
                    value={form.badgeAr}
                    onChange={(v) => setForm({ ...form, badgeAr: v })}
                  />
                  <TranslateField
                    label="شارة مميزة (EN) 🇬🇧"
                    placeholder="e.g. Best Seller · Live on Zoom"
                    value={form.badgeEn}
                    onChange={(v) => setForm({ ...form, badgeEn: v })}
                    onTranslate={() => void handleTranslate(form.badgeAr, 'badgeEn')}
                    translating={translating === 'badgeEn'}
                    disabled={!form.badgeAr.trim()}
                  />
                </div>

                {/* Extended Details AR + EN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="التفاصيل الموسعة والشرح الشامل للدورة (AR) 🇸🇦"
                    placeholder="شرح متكامل وموسع عن الدورة ومحاورها يظهر في شاشة العرض الموسعة..."
                    value={form.detailsAr}
                    onChange={(v) => setForm({ ...form, detailsAr: v })}
                    multiline
                  />
                  <TranslateField
                    label="التفاصيل الموسعة (EN) 🇬🇧"
                    placeholder="In-depth course overview shown on the expanded split modal..."
                    value={form.detailsEn}
                    onChange={(v) => setForm({ ...form, detailsEn: v })}
                    onTranslate={() => void handleTranslate(form.detailsAr, 'detailsEn')}
                    translating={translating === 'detailsEn'}
                    disabled={!form.detailsAr.trim()}
                    multiline
                  />
                </div>

                {/* Features / Curriculum List */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>
                    قائمة محاور الدورة وما ستتعلمه الأم (تظهر بنقاط مضيئة في البوباب)
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
                      placeholder="أضف محوراً أو ميزة (مثال: تسجيل كامل عالي الدقة متاح مدى الحياة) واضغط إضافة..."
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
                      <Plus size={14} /> إضافة محور
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
                      لم تُضف محاور بعد. سيتم استخدام محاور افتراضية راقية تلقائياً.
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION 4: دروس وفيديوهات الدورة التفاعلية */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'rgba(127,169,155,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--sage-dark)' }} />
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>
                      4. دروس وفيديوهات الدورة (قاعة التعلّم التفاعلية)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={openAddLesson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 cursor-pointer"
                    style={{ background: 'var(--sage-dark)' }}
                  >
                    <Plus size={14} /> إضافة درس جديد
                  </button>
                </div>

                {/* Lessons List */}
                <div className="space-y-2.5">
                  {form.lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="p-3.5 rounded-2xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      style={{ borderColor: 'rgba(127,169,155,0.2)' }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                          style={{ background: 'var(--cream)', color: 'var(--sage-dark)' }}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-sm text-[var(--text-dark)] truncate">
                              {lesson.titleAr}
                            </h4>
                            {lesson.duration && (
                              <span className="text-[11px] text-[var(--text-muted)] bg-stone-100 px-2 py-0.5 rounded-md">
                                {lesson.duration}
                              </span>
                            )}
                            {lesson.isFreePreview && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                عينة مجانية 🎁
                              </span>
                            )}
                          </div>
                          {lesson.titleEn && (
                            <p className="text-xs text-[var(--text-muted)] truncate">{lesson.titleEn}</p>
                          )}
                          {lesson.videoUrl && (
                            <p className="text-[11px] text-stone-400 truncate max-w-sm mt-0.5">
                              🎥 {lesson.videoUrl}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions: Reorder, Edit, Delete */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveLesson(idx, 'up')}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-30 transition-colors cursor-pointer"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === form.lessons.length - 1}
                          onClick={() => moveLesson(idx, 'down')}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-30 transition-colors cursor-pointer"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditLesson(idx)}
                          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-[var(--sage-dark)] transition-colors cursor-pointer"
                          title="تعديل الدرس"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLesson(idx)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          title="حذف الدرس"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {form.lessons.length === 0 && (
                    <div
                      className="p-6 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-2"
                      style={{ borderColor: 'rgba(127,169,155,0.25)', background: 'var(--cream-light)' }}
                    >
                      <Video size={28} style={{ color: 'var(--sage)' }} />
                      <p className="text-xs font-semibold text-[var(--text-dark)]">
                        لم تُضف دروس فيديو لهذه الدورة بعد
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] max-w-sm">
                        اضغطي على زر "إضافة درس جديد" لإدراج الدروس، روابط الفيديو (R2 أو يوتيوب/فيميو)، والملفات المرفقة.
                      </p>
                      <button
                        type="button"
                        onClick={openAddLesson}
                        className="mt-1 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                        style={{ background: 'var(--sage-dark)' }}
                      >
                        + إضافة أول درس الآن
                      </button>
                    </div>
                  )}
                </div>

                {/* General Course Intro Video (Optional) */}
                <div className="pt-3 border-t border-stone-100">
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--text-dark)]">
                    فيديو الغلاف / الترويجي العام للدورة (اختياري)
                  </label>
                  <div className="p-4 rounded-2xl border bg-white" style={{ borderColor: 'rgba(127,169,155,0.2)' }}>
                    <R2FileUploader
                      entityId={entityId}
                      entityType="courses"
                      currentFileKey={form.videoUrl || null}
                      onUploaded={(key) => setForm((f) => ({ ...f, videoUrl: key }))}
                      label="فيديو تعريفي عام بالدورة (رفع إلى R2)"
                      accept="video/*"
                    />
                  </div>
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
                  {saving ? 'جارٍ الحفظ...' : 'حفظ الدورة'}
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
            <p className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>حذف هذه الدورة نهائياً؟</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
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

      {/* Lesson Edit / Add Modal */}
      {showLessonDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            dir="rtl"
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[var(--cream)]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--sage-dark)] text-white flex items-center justify-center">
                  <Video size={16} />
                </div>
                <h3 className="font-black text-base text-[var(--text-dark)]">
                  {editingLessonIndex !== null ? 'تعديل بيانات الدرس' : 'إضافة درس فيديو جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLessonDialog(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Title AR + EN */}
              <FormField
                label="عنوان الدرس (AR) 🇸🇦 *"
                placeholder="مثال: المحور الأول: فهم محفزات الغضب لدى الأم"
                value={lessonForm.titleAr}
                onChange={(v) => setLessonForm({ ...lessonForm, titleAr: v })}
              />

              <FormField
                label="عنوان الدرس بالإنجليزية (EN) 🇬🇧"
                placeholder="e.g. Lesson 1: Understanding Anger Triggers"
                value={lessonForm.titleEn || ''}
                onChange={(v) => setLessonForm({ ...lessonForm, titleEn: v })}
              />

              {/* Duration & Free Preview Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="مدة الدرس (تظهر بجانب الدرس)"
                  placeholder="مثال: 15:30 دقيقة"
                  value={lessonForm.duration || ''}
                  onChange={(v) => setLessonForm({ ...lessonForm, duration: v })}
                />

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-purple-200 bg-purple-50/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(lessonForm.isFreePreview)}
                      onChange={(e) => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })}
                      className="rounded accent-[var(--sage-dark)] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-purple-950">
                      معاينة مجانية متاحة للجميع 🎁
                    </span>
                  </label>
                </div>
              </div>

              {/* Video Source: R2 Upload or Direct Link */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--text-dark)]">
                  مصدر الفيديو (رابط مباشر / يوتيوب / فيميو أو رفع ملف) *
                </label>
                <input
                  type="text"
                  value={newLessonVideoUrl}
                  onChange={(e) => {
                    setNewLessonVideoUrl(e.target.value);
                    setLessonForm((f) => ({ ...f, videoUrl: e.target.value }));
                  }}
                  placeholder="https://www.youtube.com/watch?v=... أو vimeo.com/... أو courses/..."
                  className="w-full rounded-xl px-3 py-2.5 text-xs outline-none"
                  style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
                />

                <div className="pt-1">
                  <R2FileUploader
                    entityId={entityId}
                    entityType="courses"
                    currentFileKey={lessonForm.videoUrl || null}
                    onUploaded={(key) => {
                      setNewLessonVideoUrl(key);
                      setLessonForm((f) => ({ ...f, videoUrl: key }));
                    }}
                    label="أو ارفعي ملف الفيديو مباشرة إلى استضافة R2"
                    accept="video/*"
                  />
                </div>
              </div>

              {/* Description / Notes */}
              <FormField
                label="شرح وتوجيهات الدرس (يظهر في تبويب الملاحظات)"
                placeholder="اكتبي توجيهات عملية، نقاط للتطبيق، أو تلخيص للدرس..."
                value={lessonForm.descriptionAr || ''}
                onChange={(v) => setLessonForm({ ...lessonForm, descriptionAr: v })}
                multiline
              />

              {/* Attachment */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="block text-xs font-semibold text-[var(--text-dark)]">
                  ملف مرفق للتحميل (PDF أو أوراق عمل) - اختياري
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    label="اسم الملف الظاهر للأم"
                    placeholder="مثال: ورقة_عمل_جلسة_الغضب.pdf"
                    value={lessonForm.attachmentName || ''}
                    onChange={(v) => setLessonForm({ ...lessonForm, attachmentName: v })}
                  />
                  <FormField
                    label="رابط الملف المرفق (URL أو مسار)"
                    placeholder="https://... أو courses/..."
                    value={lessonForm.attachmentUrl || ''}
                    onChange={(v) => setLessonForm({ ...lessonForm, attachmentUrl: v })}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-100 flex items-center justify-end gap-3 bg-stone-50">
              <button
                type="button"
                onClick={() => setShowLessonDialog(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={saveLesson}
                className="px-6 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                style={{ background: 'var(--sage-dark)' }}
              >
                حفظ الدرس
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal for Admin */}
      <CourseDetailModal
        isOpen={Boolean(previewCourse)}
        onClose={() => setPreviewCourse(null)}
        course={previewCourse}
        onEnroll={() => alert('هذه معاينة تجريبية لشكل بوباب الدورة في لوحة الإدارة.')}
      />
    </div>
  );
}

function FormField({
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
