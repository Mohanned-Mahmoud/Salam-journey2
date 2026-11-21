import { useEffect, useState, useMemo } from 'react';
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
  Search,
  Filter,
  Clock,
  Users,
  DollarSign,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Film,
  Sparkle,
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
  duration: 4,
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
  free: 'برنامج مجاني',
};

export function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [translating, setTranslating] = useState<string | null>(null);

  // Main Page View Mode: List vs Featured Section
  const [mainTab, setMainTab] = useState<'courses' | 'featured'>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State & Tabs
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
  const [modalTab, setModalTab] = useState<'basic' | 'curriculum' | 'media' | 'details'>('basic');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [entityId, setEntityId] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Lesson sub-editor
  const [showLessonDialog, setShowLessonDialog] = useState(false);
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
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');

  // Features & Images helpers
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Live Preview Modal
  const [previewCourse, setPreviewCourse] = useState<CourseModalData | null>(null);

  // Featured Section Settings
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

  // Load Data
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
          apiJson<{ value: string }>('/admin/site-settings/featured_course_mode').catch(() => ({ value: 'most_loved' })),
          apiJson<{ value: string }>('/admin/site-settings/featured_course_id').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/admin/site-settings/upcoming_course_id').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/admin/site-settings/featured_feature_1_ar').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/admin/site-settings/featured_feature_1_en').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/admin/site-settings/featured_feature_2_ar').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/admin/site-settings/featured_feature_2_en').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/admin/site-settings/featured_feature_3_ar').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/admin/site-settings/featured_feature_3_en').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/admin/site-settings/featured_feature_4_ar').catch(() => ({ value: '' })),
          apiJson<{ value: string }>('/admin/site-settings/featured_feature_4_en').catch(() => ({ value: '' })),
        ]);

        if (!cancelled) {
          setCourses(
            coursesData.map((c) => ({
              ...c,
              images: Array.isArray(c.images) ? c.images : (c.imageUrl || c.image_url ? [c.imageUrl || c.image_url] : []),
              featuresAr: Array.isArray(c.featuresAr || c.features_ar) ? (c.featuresAr || c.features_ar) : [],
              featuresEn: Array.isArray(c.featuresEn || c.features_en) ? (c.featuresEn || c.features_en) : [],
              lessons: Array.isArray(c.lessons) ? c.lessons : [],
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
        if (!cancelled) setError('تعذر تحميل البيانات من خادم المنصة');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAllData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        !searchQuery ||
        (c.titleAr || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.titleEn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.descAr || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = filterCategory === 'all' || c.category === filterCategory;
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [courses, searchQuery, filterCategory, filterStatus]);

  // Metrics
  const metrics = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => c.status === 'active').length;
    const free = courses.filter((c) => c.category === 'free' || Number(c.price || 0) === 0).length;
    const totalLessons = courses.reduce((acc, c) => acc + (Array.isArray(c.lessons) ? c.lessons.length : 0), 0);
    return { total, active, free, totalLessons };
  }, [courses]);

  // Auto-translate
  async function handleTranslate(sourceText: string, field: 'titleEn' | 'descEn' | 'detailsEn' | 'badgeEn') {
    if (!sourceText.trim()) return;
    try {
      setTranslating(field);
      const res = await apiJson<{ translatedText: string }>('/translate', {
        method: 'POST',
        body: JSON.stringify({ text: sourceText, targetLanguage: 'en' }),
      });
      if (res?.translatedText) {
        setForm((prev) => ({ ...prev, [field]: res.translatedText }));
      }
    } catch (err: any) {
      alert('تعذر استكمال الترجمة التلقائية: ' + (err.message || 'يرجى التأكد من ربط مفتاح الذكاء الاصطناعي'));
    } finally {
      setTranslating(null);
    }
  }

  // Open Add
  function openAdd() {
    setEntityId(crypto.randomUUID());
    setForm({
      ...EMPTY_FORM,
      coachId: coaches.length > 0 ? coaches[0].id : EMPTY_FORM.coachId,
    });
    setNewFeatureText('');
    setNewImageUrl('');
    setModalTab('basic');
    setModal({ mode: 'add' });
  }

  // Open Edit
  function openEdit(c: any) {
    setEntityId(c.id);
    const existingImages = Array.isArray(c.images) && c.images.length > 0
      ? c.images
      : (c.imageUrl || c.image_url ? [c.imageUrl || c.image_url] : []);

    setForm({
      coachId: c.coachId || c.coach_id || (coaches[0]?.id || EMPTY_FORM.coachId),
      titleAr: c.titleAr || c.title_ar || '',
      titleEn: c.titleEn || c.title_en || '',
      descAr: c.descAr || c.desc_ar || '',
      descEn: c.descEn || c.desc_en || '',
      detailsAr: c.detailsAr || c.details_ar || '',
      detailsEn: c.detailsEn || c.details_en || '',
      badgeAr: c.badgeAr || c.badge_ar || '',
      badgeEn: c.badgeEn || c.badge_en || '',
      featuresAr: Array.isArray(c.featuresAr || c.features_ar) ? [...(c.featuresAr || c.features_ar)] : [],
      featuresEn: Array.isArray(c.featuresEn || c.features_en) ? [...(c.featuresEn || c.features_en)] : [],
      category: c.category || 'course',
      price: c.price ?? 0,
      duration: c.duration ?? 4,
      students: c.students ?? '0',
      status: c.status || 'active',
      gradient: c.gradient ?? 'linear-gradient(135deg, var(--sage-dark), var(--sage))',
      imageUrl: c.imageUrl || c.image_url || (existingImages[0] || ''),
      images: existingImages,
      videoUrl: c.videoUrl || c.video_url || '',
      durationUnit: c.durationUnit || c.duration_unit || 'weeks',
      lessons: Array.isArray(c.lessons) ? [...c.lessons] : [],
    });
    setNewFeatureText('');
    setNewImageUrl('');
    setModalTab('basic');
    setModal({ mode: 'edit', id: c.id });
  }

  // Save Course
  async function handleSave() {
    if (!form.titleAr.trim()) {
      alert('يرجى إدخال اسم الدورة بالعربية أولاً');
      setModalTab('basic');
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

  // Toggle Course Active / Hidden
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

  // Delete Course
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

  // Save Featured Section
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
      alert('تم حفظ إعدادات السكشن البارز بنجاح ✓');
    } catch {
      alert('تعذر حفظ التعديلات في قاعدة البيانات');
    } finally {
      setSavingFeatured(false);
    }
  }

  // Lessons Handlers
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

  // Gallery Handlers
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
    setForm((prev) => ({ ...prev, imageUrl: imgKey }));
  }

  // Features Handlers
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

  // Preview Modal
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
    <div className="space-y-6" dir="rtl">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & METRIC CARDS                                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[var(--text-dark)] tracking-tight">
              إدارة الدورات والبرامج التدريبية
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--sage)]/15 text-[var(--sage-dark)]">
              نظام إدارة التعلّم LMS المتكامل ✨
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            إدارة المناهج، الفيديوهات المحمية، أسعار الدورات، ومعارض الصور التوضيحية
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-extrabold text-white shadow-md hover:shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          style={{ background: 'var(--sage-dark)' }}
        >
          <Plus size={18} />
          <span>إضافة دورة جديدة</span>
        </button>
      </div>

      {/* Metric Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[rgba(127,169,155,0.2)] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cream)] text-[var(--sage-dark)] flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-[var(--text-dark)]">{metrics.total}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-semibold">إجمالي الدورات والورش</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[rgba(127,169,155,0.2)] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-800">{metrics.active}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-semibold">دورات منشورة ونشطة</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[rgba(127,169,155,0.2)] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Film size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-purple-800">{metrics.totalLessons}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-semibold">محور ودرس فيديو</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[rgba(127,169,155,0.2)] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-amber-800">{metrics.free}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-semibold">برامج مجانية للتشويق</div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. MAIN SECTION TABS: COURSES LIST vs FEATURED SETTINGS      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setMainTab('courses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'courses'
              ? 'bg-[var(--sage-dark)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--cream)]'
          }`}
        >
          <BookOpen size={16} />
          <span>قائمة الدورات والورش ({courses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('featured')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'featured'
              ? 'bg-[var(--sage-dark)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-[var(--cream)]'
          }`}
        >
          <Star size={16} />
          <span>إعدادات الدورة البارزة في الصفحة الرئيسية</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. COURSES LIST VIEW (FILTER & TABLE)                        */}
      {/* ──────────────────────────────────────────────────────────── */}
      {mainTab === 'courses' && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="p-3.5 rounded-2xl bg-white border border-[rgba(127,169,155,0.2)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الدورة..."
                className="w-full pr-10 pl-3 py-2 rounded-xl text-xs bg-[var(--cream)]/60 border border-stone-200 outline-none focus:border-[var(--sage)] transition-all"
              />
            </div>

            {/* Category & Status Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-[var(--cream)]/60 border border-stone-200 outline-none text-[var(--text-dark)] font-semibold"
              >
                <option value="all">جميع الأنواع</option>
                <option value="course">دورات مسجلة</option>
                <option value="workshop">ورش مباشرة</option>
                <option value="free">مجانية</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-[var(--cream)]/60 border border-stone-200 outline-none text-[var(--text-dark)] font-semibold"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط (ظاهر)</option>
                <option value="hidden">مخفي</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="p-12 text-center text-[var(--text-muted)] bg-white rounded-2xl border border-stone-200">
              <div className="w-8 h-8 border-3 border-[var(--sage)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold">جارٍ تحميل بيانات الدورات...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Courses Table */}
          {!loading && (
            <div className="rounded-2xl overflow-hidden bg-white border border-[rgba(127,169,155,0.2)] shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[rgba(127,169,155,0.08)] border-b border-stone-200/70 text-[var(--text-dark)]">
                      <th className="text-right px-4 py-3.5 font-bold text-xs">#</th>
                      <th className="text-right px-4 py-3.5 font-bold text-xs">الدورة والغلاف</th>
                      <th className="text-right px-4 py-3.5 font-bold text-xs">السعر والنوع</th>
                      <th className="text-right px-4 py-3.5 font-bold text-xs">المنهج والدروس</th>
                      <th className="text-right px-4 py-3.5 font-bold text-xs">المعرض والشارة</th>
                      <th className="text-right px-4 py-3.5 font-bold text-xs">الطلاب</th>
                      <th className="text-right px-4 py-3.5 font-bold text-xs">الحالة</th>
                      <th className="text-center px-4 py-3.5 font-bold text-xs">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCourses.map((c, i) => {
                      const cover = c.imageUrl || c.image_url || c.images?.[0];
                      const imagesCount = c.images?.length || (cover ? 1 : 0);
                      const lessonsCount = Array.isArray(c.lessons) ? c.lessons.length : 0;
                      const hasFreePreview = Array.isArray(c.lessons) && c.lessons.some((l: any) => l.isFreePreview);

                      return (
                        <tr key={c.id} className="hover:bg-[rgba(127,169,155,0.03)] transition-colors">
                          <td className="px-4 py-3 text-xs text-[var(--text-muted)] font-mono">{i + 1}</td>

                          {/* Course Cover & Title */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-stone-200 relative flex items-center justify-center bg-[var(--cream)]">
                                {cover ? (
                                  <img
                                    src={resolveMediaUrl(cover)}
                                    alt={c.titleAr || c.title_ar}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center text-white"
                                    style={{ background: c.gradient || 'var(--sage)' }}
                                  >
                                    <BookOpen size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-[var(--text-dark)] truncate max-w-xs">
                                  {c.titleAr || c.title_ar}
                                </p>
                                <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">
                                  {c.titleEn || c.title_en || '—'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Price & Category */}
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-sm text-[var(--sage-dark)]">
                              {String(c.price) === '0' || c.category === 'free' ? 'مجاناً' : `$${c.price}`}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              {CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category}
                            </div>
                          </td>

                          {/* Lessons & Curriculum status */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[var(--sage)]/15 text-[var(--sage-dark)]">
                                <Film size={12} />
                                <span>{lessonsCount} {lessonsCount === 1 ? 'درس' : 'دروس'}</span>
                              </span>
                              {hasFreePreview && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  معاينة مجانية 🎁
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Media & Badge */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                <Layers size={13} className="text-[var(--sage)]" />
                                <span>{imagesCount} صور</span>
                              </span>
                              {c.badgeAr && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 truncate max-w-[100px]">
                                  {c.badgeAr}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Students */}
                          <td className="px-4 py-3 text-xs font-semibold text-[var(--text-muted)]">
                            {c.students || '0'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleStatus(c.id)}
                              className={`px-2.5 py-1 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                                c.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-600' : 'bg-stone-400'}`} />
                              <span>{c.status === 'active' ? 'نشط' : 'مخفي'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Live Preview Button */}
                              <button
                                type="button"
                                title="معاينة شكل الكورس في الموقع"
                                onClick={() => openPreview(c)}
                                className="p-1.5 rounded-xl hover:bg-[var(--cream)] text-xs font-bold text-[var(--sage-dark)] border border-stone-200 flex items-center gap-1 px-2.5 transition-colors cursor-pointer"
                              >
                                <Eye size={13} />
                                <span>معاينة</span>
                              </button>

                              {/* Edit Course & Curriculum */}
                              <button
                                type="button"
                                title="تعديل الدورة وإدارة الدروس"
                                onClick={() => openEdit(c)}
                                className="p-2 rounded-xl bg-[var(--cream)] hover:bg-[var(--sage)]/20 text-[var(--sage-dark)] transition-colors cursor-pointer"
                              >
                                <Pencil size={14} />
                              </button>

                              {/* Delete Course */}
                              <button
                                type="button"
                                title="حذف الدورة"
                                onClick={() => setDeleteId(c.id)}
                                className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredCourses.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[var(--text-muted)] text-xs">
                          لا توجد دورات مطابقة للبحث الحالي.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. FEATURED SECTION SETTINGS VIEW                            */}
      {/* ──────────────────────────────────────────────────────────── */}
      {mainTab === 'featured' && (
        <div className="p-6 rounded-3xl bg-white border border-[rgba(127,169,155,0.2)] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-[var(--text-dark)]">
                إعدادات السكشن البارز في الصفحة الرئيسية
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                تحديد الكورس المميز والنقاط الترويجية الأربعة المعروضة في الصفحة الرئيسية
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveFeatured}
              disabled={savingFeatured}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer"
              style={{ background: 'var(--sage-dark)' }}
            >
              {savingFeatured ? 'جارٍ الحفظ...' : 'حفظ إعدادات السكشن البارز'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--text-dark)]">
                الوضع النشط في الرئيسية:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFeaturedMode('most_loved')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    featuredMode === 'most_loved' ? 'bg-[var(--sage-dark)] text-white shadow-xs' : 'bg-[var(--cream)] text-stone-600'
                  }`}
                >
                  🔥 الأكثر طلباً
                </button>
                <button
                  type="button"
                  onClick={() => setFeaturedMode('upcoming')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    featuredMode === 'upcoming' ? 'bg-[var(--sage-dark)] text-white shadow-xs' : 'bg-[var(--cream)] text-stone-600'
                  }`}
                >
                  ⏳ قادمة قريباً
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--text-dark)]">
                كورس "الأكثر طلباً":
              </label>
              <select
                value={featuredCourseId}
                onChange={(e) => setFeaturedCourseId(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-xs bg-[var(--cream)] border border-stone-200 outline-none text-[var(--text-dark)] font-semibold"
              >
                <option value="">-- اختر دورة --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleAr || c.title_ar} {c.status === 'hidden' ? '(مخفية)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--text-dark)]">
                كورس "قادمة قريباً":
              </label>
              <select
                value={upcomingCourseId}
                onChange={(e) => setUpcomingCourseId(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-xs bg-[var(--cream)] border border-stone-200 outline-none text-[var(--text-dark)] font-semibold"
              >
                <option value="">-- اختر دورة --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleAr || c.title_ar} {c.status === 'hidden' ? '(مخفية)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Highlights 1-4 */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-[var(--text-dark)] flex items-center gap-1.5">
              <ListPlus size={15} className="text-[var(--sage)]" />
              <span>النقاط الأربعة البارزة باللغتين</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl border border-stone-200 bg-[var(--cream)]/40 space-y-2">
                <FormField label="النقطة الأولى (عربي)" value={f1Ar} onChange={setF1Ar} />
                <FormField label="النقطة الأولى (English)" value={f1En} onChange={setF1En} />
              </div>

              <div className="p-3.5 rounded-2xl border border-stone-200 bg-[var(--cream)]/40 space-y-2">
                <FormField label="النقطة الثانية (عربي)" value={f2Ar} onChange={setF2Ar} />
                <FormField label="النقطة الثانية (English)" value={f2En} onChange={setF2En} />
              </div>

              <div className="p-3.5 rounded-2xl border border-stone-200 bg-[var(--cream)]/40 space-y-2">
                <FormField label="النقطة الثالثة (عربي)" value={f3Ar} onChange={setF3Ar} />
                <FormField label="النقطة الثالثة (English)" value={f3En} onChange={setF3En} />
              </div>

              <div className="p-3.5 rounded-2xl border border-stone-200 bg-[var(--cream)]/40 space-y-2">
                <FormField label="النقطة الرابعة (عربي)" value={f4Ar} onChange={setF4Ar} />
                <FormField label="النقطة الرابعة (English)" value={f4En} onChange={setF4En} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. ADD / EDIT COURSE MODAL (CLEAN TABBED DESIGN)             */}
      {/* ──────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col bg-white shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-[var(--cream)]/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--sage-dark)] text-white flex items-center justify-center shadow-xs">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="font-black text-base sm:text-lg text-[var(--text-dark)]">
                    {modal.mode === 'add' ? 'إضافة دورة تدريبية جديدة' : 'تعديل بيانات الدورة والمنهج'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    تنظيم الدروس، المحاور التفاعلية، ومعرض الصور بدقة وسلاسة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPreview(form)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--sage-dark)] bg-white border border-stone-200 hover:bg-[var(--cream)] transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>معاينة البوباب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Sub-Tabs Navigation (Basic / Curriculum / Media / Features) */}
            <div className="px-6 pt-3 pb-1 border-b border-stone-200/80 bg-[var(--cream)]/30 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('basic')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modalTab === 'basic'
                    ? 'bg-[var(--sage-dark)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:bg-stone-100'
                }`}
              >
                <span>1. البيانات الأساسية والأسعار</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('curriculum')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modalTab === 'curriculum'
                    ? 'bg-[var(--sage-dark)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:bg-stone-100'
                }`}
              >
                <Film size={14} />
                <span>2. المنهج والدروس ({form.lessons.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('media')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modalTab === 'media'
                    ? 'bg-[var(--sage-dark)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:bg-stone-100'
                }`}
              >
                <ImageIcon size={14} />
                <span>3. الغلاف ومعرض الصور ({form.images.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modalTab === 'details'
                    ? 'bg-[var(--sage-dark)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:bg-stone-100'
                }`}
              >
                <Sparkles size={14} />
                <span>4. الشارات والمحاور الموسعة</span>
              </button>
            </div>

            {/* Modal Tab Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              {/* ─────────────────────────────────────────────────── */}
              {/* TAB 1: BASIC INFO & PRICING                         */}
              {/* ─────────────────────────────────────────────────── */}
              {modalTab === 'basic' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Coach selection */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-dark)] mb-1.5">
                      المدرب المسؤول عن الدورة *
                    </label>
                    <select
                      value={form.coachId}
                      onChange={(e) => setForm({ ...form, coachId: e.target.value })}
                      className="w-full rounded-xl px-3 py-2.5 text-xs bg-[var(--cream)] border border-stone-200 outline-none text-[var(--text-dark)] font-semibold"
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
                      label="اسم الدورة بالعربية 🇸🇦 *"
                      placeholder="مثال: وأصبحتُ أُمّاً هادئة"
                      value={form.titleAr}
                      onChange={(v) => setForm({ ...form, titleAr: v })}
                    />
                    <TranslateField
                      label="اسم الدورة بالإنجليزية 🇬🇧"
                      placeholder="e.g. Becoming a Calm Mother"
                      value={form.titleEn}
                      onChange={(v) => setForm({ ...form, titleEn: v })}
                      onTranslate={() => void handleTranslate(form.titleAr, 'titleEn')}
                      translating={translating === 'titleEn'}
                      disabled={!form.titleAr.trim()}
                    />
                  </div>

                  {/* Brief description AR + EN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="الوصف المختصر (عربي) 🇸🇦"
                      placeholder="وصف تسويقي موجز يظهر في بطاقة الدورة في الشبكة..."
                      value={form.descAr}
                      onChange={(v) => setForm({ ...form, descAr: v })}
                      multiline
                    />
                    <TranslateField
                      label="الوصف المختصر (English) 🇬🇧"
                      placeholder="Brief card description..."
                      value={form.descEn}
                      onChange={(v) => setForm({ ...form, descEn: v })}
                      onTranslate={() => void handleTranslate(form.descAr, 'descEn')}
                      translating={translating === 'descEn'}
                      disabled={!form.descAr.trim()}
                      multiline
                    />
                  </div>

                  {/* Price, Category, Duration, Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-[var(--cream)]/40 border border-stone-200">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-dark)] mb-1">
                        السعر بالدولار ($) *
                      </label>
                      <input
                        type="text"
                        value={String(form.price)}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="0 للمجانية"
                        className="w-full rounded-xl px-3 py-2 text-xs bg-white border border-stone-200 outline-none font-mono font-bold"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                        ضع 0 إذا كانت الدورة مجانية
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-dark)] mb-1">
                        نوع الدورة
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value as AdminCourse['category'] })}
                        className="w-full rounded-xl px-3 py-2 text-xs bg-white border border-stone-200 outline-none font-semibold"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-dark)] mb-1">
                        المدة
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={form.duration || ''}
                          onChange={(e) => setForm({ ...form, duration: Number(e.target.value) || 0 })}
                          placeholder="4"
                          className="w-1/2 rounded-xl px-2 py-2 text-xs bg-white border border-stone-200 outline-none font-bold"
                        />
                        <select
                          value={form.durationUnit || 'weeks'}
                          onChange={(e) => setForm({ ...form, durationUnit: e.target.value })}
                          className="w-1/2 rounded-xl px-2 py-2 text-[11px] bg-white border border-stone-200 outline-none font-semibold"
                        >
                          <option value="weeks">أسابيع</option>
                          <option value="minutes">دقائق</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-dark)] mb-1">
                        حالة الظهور
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as AdminCourse['status'] })}
                        className="w-full rounded-xl px-3 py-2 text-xs bg-white border border-stone-200 outline-none font-bold"
                      >
                        <option value="active">نشط (معروض في الموقع)</option>
                        <option value="hidden">مخفي (معطل مؤقتاً)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────── */}
              {/* TAB 2: CURRICULUM & LESSONS (THE CORE LMS PART)     */}
              {/* ─────────────────────────────────────────────────── */}
              {modalTab === 'curriculum' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Curriculum Header & Action */}
                  <div className="p-4 rounded-2xl bg-[var(--cream)]/60 border border-[rgba(127,169,155,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Film size={18} className="text-[var(--sage-dark)]" />
                        <h3 className="font-extrabold text-sm text-[var(--text-dark)]">
                          قائمة دروس ومحاور الدورة التدريبية
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        هذه الدروس ستظهر للأمهات في قاعة المشاهدة المتقدمة، مع حماية البث من التحميل المباشر.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openAddLesson}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer shrink-0"
                      style={{ background: 'var(--sage-dark)' }}
                    >
                      <Plus size={16} />
                      <span>إضافة درس فيديو جديد</span>
                    </button>
                  </div>

                  {/* Lessons Cards List */}
                  <div className="space-y-3">
                    {form.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        className="p-4 rounded-2xl border border-stone-200/90 bg-white hover:border-[var(--sage)]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Index Badge */}
                          <div className="w-8 h-8 rounded-xl bg-[var(--cream)] text-[var(--sage-dark)] border border-stone-200 font-mono font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-[var(--text-dark)] truncate">
                                {lesson.titleAr}
                              </h4>
                              {lesson.duration && (
                                <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock size={11} />
                                  <span>{lesson.duration}</span>
                                </span>
                              )}
                              {lesson.isFreePreview ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                  معاينة مجانية 🎁
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 flex items-center gap-1">
                                  <Lock size={10} /> محتوى مدفوع
                                </span>
                              )}
                            </div>

                            {lesson.titleEn && (
                              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                                {lesson.titleEn}
                              </p>
                            )}

                            {/* Media Status Indicator */}
                            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                              {lesson.videoUrl ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1 truncate max-w-xs">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  <span>فيديو مجهز: {lesson.videoUrl.split('/').pop()}</span>
                                </span>
                              ) : (
                                <span className="text-amber-600 font-semibold flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  <span>لم يُرفق فيديو بعد</span>
                                </span>
                              )}

                              {lesson.attachmentUrl && (
                                <span className="text-[var(--sage-dark)] font-semibold flex items-center gap-1">
                                  <FileText size={12} />
                                  <span>مرفق عمل: {lesson.attachmentName || 'ملف PDF'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Lesson Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveLesson(idx, 'up')}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-25 transition-colors cursor-pointer text-stone-600"
                            title="تحريك لأعلى"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === form.lessons.length - 1}
                            onClick={() => moveLesson(idx, 'down')}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-25 transition-colors cursor-pointer text-stone-600"
                            title="تحريك لأسفل"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditLesson(idx)}
                            className="p-1.5 rounded-lg border border-stone-200 bg-[var(--cream)] hover:bg-[var(--sage)]/20 text-[var(--sage-dark)] transition-colors cursor-pointer"
                            title="تعديل الدرس"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLesson(idx)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                            title="حذف الدرس"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {form.lessons.length === 0 && (
                      <div className="p-8 text-center rounded-2xl border-2 border-dashed border-stone-300 bg-[var(--cream)]/30 flex flex-col items-center justify-center gap-2">
                        <Video size={32} className="text-[var(--sage)]" />
                        <h4 className="font-bold text-sm text-[var(--text-dark)]">لم تتم إضافة أي دروس فيديو بعد</h4>
                        <p className="text-xs text-[var(--text-muted)] max-w-sm">
                          قسّمي الدورة إلى عدة محاور ودروس لتقديم تجربة تعليمية مريحة للأمهات.
                        </p>
                        <button
                          type="button"
                          onClick={openAddLesson}
                          className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                          style={{ background: 'var(--sage-dark)' }}
                        >
                          + إضافة الدرس الأول الآن
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Course Intro Video Option */}
                  <div className="p-4 rounded-2xl bg-[var(--cream)]/40 border border-stone-200 space-y-2">
                    <label className="block text-xs font-bold text-[var(--text-dark)]">
                      فيديو ترويجي عام للدورة (اختياري - يظهر كبرومو تعريفي)
                    </label>
                    <R2FileUploader
                      entityId={entityId}
                      entityType="courses"
                      currentFileKey={form.videoUrl || null}
                      onUploaded={(key) => setForm((f) => ({ ...f, videoUrl: key }))}
                      label="رفع برومو الدورة التعريفي (R2)"
                      accept="video/*"
                    />
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────── */}
              {/* TAB 3: MEDIA & IMAGES GALLERY                       */}
              {/* ─────────────────────────────────────────────────── */}
              {modalTab === 'media' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-dark)]">
                        معرض صور الدورة (بوسترات، شهادات، محاور)
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        الصورة المعينة كـ "الغلاف" تظهر في الكروت الرئيسية، وباقي الصور تظهر في معرض التصفح.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--sage)]/15 text-[var(--sage-dark)]">
                      {form.images.length} صور
                    </span>
                  </div>

                  {/* Thumbnails grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {form.images.map((imgKey, idx) => {
                      const isPrimary = form.imageUrl === imgKey || (!form.imageUrl && idx === 0);
                      return (
                        <div
                          key={imgKey}
                          className={`group relative rounded-2xl overflow-hidden border p-1.5 flex flex-col justify-between transition-all ${
                            isPrimary ? 'ring-2 ring-[var(--sage-dark)] shadow-sm' : 'border-stone-200'
                          } bg-[var(--cream)]/40`}
                        >
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
                            <img
                              src={resolveMediaUrl(imgKey)}
                              alt={`صورة ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {isPrimary && (
                              <span
                                className="absolute top-1.5 start-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs flex items-center gap-1"
                                style={{ background: 'var(--sage-dark)' }}
                              >
                                <Star size={10} className="fill-white" /> الغلاف
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => removeImageFromGallery(imgKey)}
                              title="حذف من المعرض"
                              className="absolute top-1.5 end-1.5 p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          <div className="pt-2 text-center">
                            {!isPrimary ? (
                              <button
                                type="button"
                                onClick={() => setAsPrimaryImage(imgKey)}
                                className="w-full text-[11px] font-bold py-1 rounded-lg hover:bg-white text-[var(--sage-dark)] border border-[rgba(127,169,155,0.3)] transition-colors cursor-pointer"
                              >
                                تعيين كغلاف
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-[var(--sage-dark)] flex items-center justify-center gap-1">
                                <Check size={12} /> الغلاف الرئيسي
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {form.images.length === 0 && (
                      <div className="col-span-full py-8 text-center rounded-2xl border-2 border-dashed border-stone-300 bg-[var(--cream)]/30 flex flex-col items-center justify-center gap-2">
                        <ImageIcon size={28} className="text-[var(--sage)]" />
                        <p className="text-xs font-bold text-[var(--text-dark)]">لا توجد صور في المعرض بعد</p>
                        <p className="text-[11px] text-[var(--text-muted)]">ارفعي بوستر الدورة عبر الأداة أدناه</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl border border-stone-200 bg-white">
                      <R2FileUploader
                        entityId={entityId}
                        entityType="courses"
                        onUploaded={(key) => addImageToGallery(key)}
                        label="رفع صورة جديدة إلى المعرض (Cloudflare R2)"
                        accept="image/*"
                      />
                    </div>

                    <div className="p-4 rounded-2xl border border-stone-200 bg-white flex flex-col justify-between">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-dark)] mb-1.5">
                          أو إدراج رابط صورة خارجي مباشر
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="https://... أو courses/..."
                            className="flex-1 rounded-xl px-3 py-2 text-xs bg-[var(--cream)] border border-stone-200 outline-none text-[var(--text-dark)] font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => addImageToGallery(newImageUrl)}
                            disabled={!newImageUrl.trim()}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 cursor-pointer"
                            style={{ background: 'var(--sage-dark)' }}
                          >
                            إضافة
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-2">
                        سيتم إدراج الصورة مباشرة في المعرض وتعيينها إذا كان المعرض فارغاً.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────── */}
              {/* TAB 4: BADGES & EXTENDED DETAILS                    */}
              {/* ─────────────────────────────────────────────────── */}
              {modalTab === 'details' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Badge AR + EN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="شارة مميزة على الكارت (AR) 🇸🇦"
                      placeholder="مثال: الأكثر طلباً ⭐ · مباشر عبر زووم · مقاعد محدودة"
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

                  {/* Extended Overview AR + EN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="الشرح والتفاصيل الموسعة للدورة (عربي) 🇸🇦"
                      placeholder="شرح متكامل وموسع عن الدورة وأهدافها يظهر في شاشة العرض الموسعة..."
                      value={form.detailsAr}
                      onChange={(v) => setForm({ ...form, detailsAr: v })}
                      multiline
                    />
                    <TranslateField
                      label="التفاصيل الموسعة (English) 🇬🇧"
                      placeholder="In-depth course overview..."
                      value={form.detailsEn}
                      onChange={(v) => setForm({ ...form, detailsEn: v })}
                      onTranslate={() => void handleTranslate(form.detailsAr, 'detailsEn')}
                      translating={translating === 'detailsEn'}
                      disabled={!form.detailsAr.trim()}
                      multiline
                    />
                  </div>

                  {/* Highlights Bullet Points */}
                  <div className="p-4 rounded-2xl bg-[var(--cream)]/40 border border-stone-200 space-y-3">
                    <label className="block text-xs font-bold text-[var(--text-dark)]">
                      محاور ومميزات الدورة (تظهر بنقاط مضيئة في بوباب العرض)
                    </label>

                    <div className="flex gap-2">
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
                        placeholder="أضف محوراً (مثال: تسجيل كامل عالي الدقة متاح مدى الحياة) واضغط إضافة..."
                        className="flex-1 rounded-xl px-3 py-2 text-xs bg-white border border-stone-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={addFeature}
                        disabled={!newFeatureText.trim()}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                        style={{ background: 'var(--sage-dark)' }}
                      >
                        <Plus size={14} /> إضافة
                      </button>
                    </div>

                    {form.featuresAr.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {form.featuresAr.map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[rgba(127,169,155,0.3)] text-[var(--sage-dark)] shadow-2xs"
                          >
                            <Check size={12} className="text-emerald-600" />
                            <span>{feat}</span>
                            <button
                              type="button"
                              onClick={() => removeFeature(idx)}
                              className="hover:text-rose-600 transition-colors ms-1 p-0.5 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] italic">
                        لم تُضف محاور خاصة بعد. ستُعرض المحاور الافتراضية الأنيقة تلقائياً.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-stone-200 bg-[var(--cream)]/60 shrink-0">
              <button
                type="button"
                onClick={() => openPreview(form)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[var(--sage-dark)] bg-white border border-stone-200 hover:bg-[var(--cream)] transition-all cursor-pointer"
              >
                <Eye size={14} />
                <span>معاينة شكل البوباب الآن</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-200/50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                  style={{ background: 'var(--sage-dark)' }}
                >
                  {saving ? 'جارٍ الحفظ...' : 'حفظ بيانات الدورة كاملة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 6. LESSON ADD / EDIT DIALOG (CLEAN & STEP-BY-STEP)           */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showLessonDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[var(--cream)]/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--sage-dark)] text-white flex items-center justify-center">
                  <Video size={16} />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[var(--text-dark)]">
                    {editingLessonIndex !== null ? 'تعديل بيانات المحور / الدرس' : 'إضافة درس فيديو جديد للمنهج'}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">إعداد عنوان الفيديو ورابط البث والملحقات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLessonDialog(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <FormField
                label="عنوان الدرس بالعربية 🇸🇦 *"
                placeholder="مثال: المحور الأول: فهم محفزات الغضب لدى الأم"
                value={lessonForm.titleAr}
                onChange={(v) => setLessonForm({ ...lessonForm, titleAr: v })}
              />

              <FormField
                label="عنوان الدرس بالإنجليزية 🇬🇧"
                placeholder="e.g. Lesson 1: Understanding Anger Triggers"
                value={lessonForm.titleEn || ''}
                onChange={(v) => setLessonForm({ ...lessonForm, titleEn: v })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="مدة الدرس المقدرة"
                  placeholder="مثال: 15 دقيقة أو 15:30"
                  value={lessonForm.duration || ''}
                  onChange={(v) => setLessonForm({ ...lessonForm, duration: v })}
                />

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(lessonForm.isFreePreview)}
                      onChange={(e) => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })}
                      className="rounded accent-[var(--sage-dark)] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-purple-950">
                      معاينة مجانية متاحة قبل الاشتراك 🎁
                    </span>
                  </label>
                </div>
              </div>

              {/* Video Upload or Link */}
              <div className="p-3.5 rounded-2xl bg-[var(--cream)]/40 border border-stone-200 space-y-2.5">
                <label className="block text-xs font-bold text-[var(--text-dark)]">
                  مصدر ملف الفيديو (رفع مباشر لـ R2 أو رابط خارجي) *
                </label>

                <input
                  type="text"
                  value={newLessonVideoUrl}
                  onChange={(e) => {
                    setNewLessonVideoUrl(e.target.value);
                    setLessonForm((f) => ({ ...f, videoUrl: e.target.value }));
                  }}
                  placeholder="courses/... أو رابط يوتيوب أو فيميو"
                  className="w-full rounded-xl px-3 py-2 text-xs bg-white border border-stone-200 outline-none font-mono"
                />

                <R2FileUploader
                  entityId={entityId}
                  entityType="courses"
                  currentFileKey={lessonForm.videoUrl || null}
                  onUploaded={(key) => {
                    setNewLessonVideoUrl(key);
                    setLessonForm((f) => ({ ...f, videoUrl: key }));
                  }}
                  label="أو ارفعي ملف الفيديو مباشرة (MP4 / WebM إلى استضافة R2)"
                  accept="video/*"
                />
              </div>

              {/* Description / Instructor Notes */}
              <FormField
                label="شرح وتوجيهات الدرس (يظهر في تبويب الملاحظات والتطبيقات)"
                placeholder="اكتبي توجيهات عملية، نقاط للتطبيق، أو تلخيص للدرس..."
                value={lessonForm.descriptionAr || ''}
                onChange={(v) => setLessonForm({ ...lessonForm, descriptionAr: v })}
                multiline
              />

              {/* Attachment Download (PDF via Cloudflare R2) */}
              <div className="p-4 rounded-2xl bg-[var(--cream)]/40 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[var(--text-dark)] flex items-center gap-1.5">
                    <FileText size={14} className="text-amber-600" />
                    <span>ملف مرفق للتحميل مع الدرس (ورقة عمل PDF أو ملفات تدريبية) - اختياري</span>
                  </label>
                  {lessonForm.attachmentUrl && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check size={10} /> تم إرفاق ملف
                    </span>
                  )}
                </div>

                {/* File Display Name */}
                <FormField
                  label="اسم الملف الظاهر للأم (مثال: ورقة_عمل_جلسة_الغضب.pdf)"
                  placeholder="مثال: ورقة عمل وتطبيقات الدرس.pdf"
                  value={lessonForm.attachmentName || ''}
                  onChange={(v) => setLessonForm({ ...lessonForm, attachmentName: v })}
                />

                {/* Direct R2 Upload for Attachment */}
                <div className="pt-1">
                  <R2FileUploader
                    entityId={entityId}
                    entityType="courses"
                    currentFileKey={lessonForm.attachmentUrl || null}
                    onUploaded={(key) => {
                      const defaultName = key.split('/').pop()?.replace(/^\d+-/, '') || 'ورقة_عمل_الدرس.pdf';
                      setLessonForm((f) => ({
                        ...f,
                        attachmentUrl: key,
                        attachmentName: f.attachmentName || defaultName,
                      }));
                    }}
                    label="رفع ملف ورقة العمل (PDF / أوراق عمل) إلى Cloudflare R2"
                    accept=".pdf,.doc,.docx,.epub,.zip,application/pdf"
                  />
                </div>

                {/* Manual fallback input & delete button */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={lessonForm.attachmentUrl || ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, attachmentUrl: e.target.value })}
                    placeholder="رابط الملف المرفق أو مسار R2 (courses/...)"
                    className="flex-1 rounded-xl px-3 py-2 text-xs bg-white border border-stone-200 outline-none font-mono text-[var(--text-dark)]"
                  />
                  {lessonForm.attachmentUrl && (
                    <button
                      type="button"
                      onClick={() => setLessonForm({ ...lessonForm, attachmentUrl: '', attachmentName: '' })}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shrink-0"
                      title="حذف الملف المرفق"
                    >
                      إزالة المرفق
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50">
              <button
                type="button"
                onClick={() => setShowLessonDialog(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-200 transition-colors cursor-pointer"
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="rounded-2xl p-6 max-w-sm w-full text-center space-y-4 bg-white shadow-xl border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <p className="text-base font-bold text-[var(--text-dark)]">هل أنتِ متأكدة من حذف هذه الدورة نهائياً؟</p>
            <p className="text-xs text-[var(--text-muted)]">
              سيتم حذف جميع محتويات الدورة ودروسها من قاعدة البيانات.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
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
  const cls = 'w-full rounded-xl px-3 py-2.5 text-xs outline-none transition-colors';
  const style = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 text-[var(--text-dark)]">
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
  const cls = 'w-full rounded-xl px-3 py-2.5 text-xs outline-none transition-colors';
  const style = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-[var(--text-dark)]">
          {label}
        </label>
        <button
          type="button"
          onClick={onTranslate}
          disabled={translating || disabled}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
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
