import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  X,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Clock,
  Video,
  Infinity as InfinityIcon,
  Minimize2,
  ExternalLink,
  Users,
  Play,
  Lock,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";

export interface CourseModalData {
  id: string;
  title: { ar: string; en: string };
  desc: { ar: string; en: string };
  details?: { ar: string; en: string };
  category: "course" | "workshop" | "free";
  duration: { ar: string; en: string };
  students: string;
  features?: string[];
  badge?: { ar: string; en: string } | null;
  price: { ar: string; en: string };
  rawPrice: number;
  free: boolean;
  imageUrl?: string | null;
  images?: string[];
  gradient?: string;
  videoUrl?: string | null;
  lessons?: Array<{
    id: string;
    titleAr: string;
    titleEn?: string;
    duration?: string;
    videoUrl?: string;
    descriptionAr?: string;
    isFreePreview?: boolean;
    attachmentUrl?: string;
    attachmentName?: string;
  }>;
}

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseModalData | null;
  onEnroll: (course: CourseModalData) => void;
  isProcessing?: boolean;
  isEnrolled?: boolean;
  initialExpanded?: boolean;
}

export function CourseDetailModal({
  isOpen,
  onClose,
  course,
  onEnroll,
  isProcessing = false,
  isEnrolled = false,
  initialExpanded = false,
}: CourseDetailModalProps) {
  const [, navigate] = useLocation();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleActionClick = () => {
    if (isEnrolled || course?.free) {
      onClose();
      navigate(`/courses/${course?.id}/learn`);
      return;
    }
    if (course) onEnroll(course);
  };

  const handlePreviewLesson = (lessonId: string) => {
    onClose();
    navigate(`/courses/${course?.id}/learn?lesson=${lessonId}`);
  };

  // Touch swipe support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      // On mobile screens (< 768px), open directly in the complete rich view for effortless mobile UX
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      setIsExpanded(isMobile ? true : initialExpanded);
      setSelectedImageIndex(0);
      setTouchStart(null);
      setTouchEnd(null);
    }
  }, [isOpen, course?.id, initialExpanded]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !course) return null;

  const rawImages =
    course.images && course.images.length > 0
      ? course.images
      : course.imageUrl
      ? [course.imageUrl]
      : [];

  const displayImages = rawImages.map((img) => resolveMediaUrl(img));
  const hasImages = displayImages.length > 0;
  const currentImage = hasImages ? displayImages[selectedImageIndex] || displayImages[0] : null;

  const nextImage = () => {
    if (displayImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    if (displayImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  // Touch swipe handling
  const minSwipeDistance = 40;
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      nextImage();
    } else if (distance < -minSwipeDistance) {
      prevImage();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const featuresList =
    course.features && course.features.length > 0
      ? course.features
      : [
          "دروس مسجلة وجلسات تفاعلية عالية الدقة",
          "ملفات وتطبيقات عملية مرافقة لكل محور",
          "شهادة إتمام معتمدة من المنصة",
          "وصول دائم ومستمر لكافة التحديثات",
        ];

  const extendedDesc = course.details?.ar || course.desc.ar;

  const getCategoryLabel = () => {
    if (course.category === "workshop") return "ورشة عمل تدريبية";
    if (course.category === "free") return "دورة مجانية";
    return "برنامج ودورة تدريبية";
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark Ambient Backdrop */}
      <div
        className="fixed inset-0 bg-[#1A2E2A]/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white w-full shadow-2xl overflow-hidden z-10 transition-all duration-300 ease-out flex flex-col ${
          isExpanded
            ? "h-[90dvh] max-h-[90dvh] sm:h-[90vh] md:h-[84vh] md:max-h-[720px] max-w-full md:max-w-4xl lg:max-w-5xl rounded-t-[28px] sm:rounded-3xl"
            : "max-h-[88dvh] max-w-full sm:max-w-md md:max-w-lg rounded-t-[28px] sm:rounded-3xl"
        }`}
        style={{
          boxShadow: "0 25px 60px -15px rgba(26, 46, 42, 0.4)",
          border: "1px solid rgba(127, 169, 155, 0.2)",
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1 bg-gradient-to-r from-[var(--sage)] via-[var(--sage-dark)] to-[var(--blush)] shrink-0" />

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MODE 1: COMPACT QUICK VIEW (للكمبيوتر فقط قبل التوسيع)        */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {!isExpanded ? (
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Mobile Sheet Drag Indicator */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-stone-300" />
            </div>

            {/* Floating Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-40 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-[var(--text-dark)] flex items-center justify-center shadow-md transition-all hover:scale-105 border border-black/5"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Visual Cover / Image Header */}
            <div
              className="h-48 sm:h-56 relative shrink-0 overflow-hidden flex items-center justify-center cursor-pointer"
              style={{
                background:
                  course.gradient || "linear-gradient(135deg, var(--sage-dark), var(--sage))",
              }}
              onClick={() => setIsExpanded(true)}
            >
              {hasImages && currentImage ? (
                <img
                  src={currentImage}
                  alt={course.title.ar}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-xs shadow-sm flex items-center justify-center mb-2">
                    <BookOpen size={36} className="text-white" />
                  </div>
                </div>
              )}

              {/* Badge Tag */}
              {course.badge?.ar && (
                <span className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--sage-dark)] shadow-sm border border-[rgba(127,169,155,0.25)]">
                  {course.badge.ar}
                </span>
              )}

              {/* Quick Image Count Pill */}
              {displayImages.length > 1 && (
                <span className="absolute bottom-3 left-3.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-xs">
                  📷 {displayImages.length} صور
                </span>
              )}
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--cream)] text-[var(--sage-dark)] border border-[rgba(127,169,155,0.2)]">
                    {getCategoryLabel()}
                  </span>
                  <span className="text-xl font-extrabold text-[var(--sage-dark)]">
                    {course.price.ar}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-dark)] mb-2.5 leading-snug">
                  {course.title.ar}
                </h2>

                <p className="text-xs sm:text-sm text-[var(--text-body)] leading-relaxed mb-4 whitespace-pre-wrap">
                  {course.desc.ar}
                </p>

                {/* Duration & Students stats */}
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-5">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Clock size={14} className="text-[var(--sage-dark)]" /> {course.duration.ar}
                  </span>
                  {course.students && course.students !== "—" && (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Users size={14} className="text-[var(--sage-dark)]" /> {course.students} مسجلة
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: عرض التفاصيل + التسجيل */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 pt-4 border-t border-[rgba(127,169,155,0.18)]">
                {/* Secondary Button: عرض التفاصيل */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl border-2 border-[var(--sage)] bg-[var(--cream)]/60 hover:bg-[var(--cream)] text-[var(--text-dark)] font-extrabold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>عرض التفاصيل</span>
                </button>

                {/* Primary Button: التسجيل بالدورة */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleActionClick}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>جاري التحويل...</span>
                  ) : isEnrolled ? (
                    <span>دخول الدورة ومتابعة التعلّم ➔</span>
                  ) : course.free ? (
                    <span>ابدئي مجاناً الآن ➔</span>
                  ) : (
                    <>
                      <span>اشتركي الآن ({course.price.ar})</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════ */
          /* MODE 2: EXPANDED VIEW                                         */
          /* ══════════════════════════════════════════════════════════════ */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* ──────────────────────────────────────────────────────────── */}
            {/* DESKTOP VIEW (≥ 768px): المتصفح والشاشة المقسمة                */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div className="hidden md:flex w-full h-full relative">
              {/* RIGHT SIDE (Desktop): معرض صور الدورة والمحاور */}
              <div className="w-1/2 relative bg-[#FBF9F5] flex flex-col p-6 shrink-0 border-l border-[rgba(127,169,155,0.18)] overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden bg-white border border-[rgba(127,169,155,0.2)] shadow-xs flex items-center justify-center flex-1 min-h-0 group">
                  {hasImages && currentImage ? (
                    <img
                      key={currentImage}
                      src={currentImage}
                      alt={course.title.ar}
                      className="w-full h-full object-contain p-3 transition-all duration-300 ease-out"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white"
                      style={{
                        background:
                          course.gradient ||
                          "linear-gradient(135deg, var(--sage-dark), var(--sage))",
                      }}
                    >
                      <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xs shadow-md flex items-center justify-center mb-2">
                        <BookOpen size={40} className="text-white" />
                      </div>
                      <span className="font-extrabold text-base text-white">
                        {course.title.ar}
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  {course.badge?.ar && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--sage-dark)] shadow-sm z-30 border border-[rgba(127,169,155,0.25)]">
                      {course.badge.ar}
                    </span>
                  )}

                  {/* Desktop Prev / Next */}
                  {displayImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImage}
                        aria-label="الصورة السابقة"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[var(--text-dark)] shadow-md flex items-center justify-center transition-all hover:scale-105 z-20 border border-black/5 cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        aria-label="الصورة التالية"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[var(--text-dark)] shadow-md flex items-center justify-center transition-all hover:scale-105 z-20 border border-black/5 cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-xs z-10">
                        {selectedImageIndex + 1} من {displayImages.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails (Always visible, never cut off) */}
                {displayImages.length > 1 && (
                  <div className="shrink-0 mt-3 flex items-center gap-2 overflow-x-auto pb-1 px-0.5 scrollbar-thin">
                    {displayImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-[var(--sage-dark)] ring-2 ring-[var(--sage)]/40 scale-105"
                            : "border-stone-200 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`صورة ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LEFT SIDE (Desktop): التفاصيل الموسعة ومحاور الدورة مع شريط إجراءات ثابت */}
              <div className="w-1/2 flex flex-col h-full bg-white relative z-10 overflow-hidden">
                {/* Scrollable Details Body */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-7 space-y-4">
                  {/* Top Header Row with Category, Price, and Close Button */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--cream)] text-[var(--sage-dark)] border border-[rgba(127,169,155,0.2)]">
                      {getCategoryLabel()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-[var(--sage-dark)]">
                        {course.price.ar}
                      </span>
                      <button
                        type="button"
                        onClick={onClose}
                        aria-label="إغلاق"
                        className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all hover:scale-105 border border-stone-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-dark)] leading-snug">
                    {course.title.ar}
                  </h1>

                  {/* Description */}
                  <div className="p-4 rounded-2xl bg-[var(--cream)]/50 border border-[rgba(127,169,155,0.18)]">
                    <h3 className="text-xs font-bold text-[var(--sage-dark)] mb-1.5">
                      نبذة عن محتوى البرنامج:
                    </h3>
                    <p className="text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-line">
                      {extendedDesc}
                    </p>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--text-dark)] mb-2.5 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>ماذا ستتعلمين في هذه الدورة؟</span>
                    </h3>
                    <ul className="space-y-2">
                      {featuresList.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs lg:text-sm text-[var(--text-body)]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Curriculum Breakdown */}
                  {course.lessons && course.lessons.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-extrabold text-[var(--text-dark)] flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[var(--sage-dark)]" />
                          <span>محاور وفهرس الدورة</span>
                        </h3>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--cream)] text-[var(--sage-dark)]">
                          {course.lessons.length} دروس فيديو
                        </span>
                      </div>

                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                        {course.lessons.map((lesson, idx) => (
                          <div
                            key={lesson.id}
                            className="p-2.5 rounded-xl border border-stone-100 bg-[#FAF8F5] flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-[10px] font-bold text-stone-600 flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-stone-800 truncate">
                                {lesson.titleAr}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {lesson.duration && (
                                <span className="text-[10px] text-stone-500 font-medium">
                                  {lesson.duration}
                                </span>
                              )}
                              {lesson.isFreePreview && (
                                <button
                                  type="button"
                                  onClick={() => handlePreviewLesson(lesson.id)}
                                  className="px-2 py-0.5 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  معاينة مجانية 👁️
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-2xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)] text-center">
                      <Clock className="w-4 h-4 text-[var(--sage-dark)] mx-auto mb-1" />
                      <span className="block text-[10px] text-[var(--text-muted)]">المدة</span>
                      <span className="block text-xs font-bold text-[var(--text-dark)]">
                        {course.duration.ar}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)] text-center">
                      <Video className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                      <span className="block text-[10px] text-[var(--text-muted)]">صيغة الحضور</span>
                      <span className="block text-xs font-bold text-[var(--text-dark)]">
                        أونلاين بالكامل
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)] text-center">
                      <InfinityIcon className="w-4 h-4 text-[var(--sage-dark)] mx-auto mb-1" />
                      <span className="block text-[10px] text-[var(--text-muted)]">صلاحية الوصول</span>
                      <span className="block text-xs font-bold text-[var(--text-dark)]">
                        مدى الحياة
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fixed Sticky Desktop Action Bar (Always visible at bottom!) */}
                <div className="shrink-0 p-4 lg:p-5 bg-white/95 backdrop-blur-md border-t border-[rgba(127,169,155,0.18)] shadow-[0_-4px_20px_rgba(0,0,0,0.04)] space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleActionClick}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white font-black text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? (
                        <span>جاري التحويل...</span>
                      ) : isEnrolled ? (
                        <span>دخول الدورة ومتابعة التعلّم ➔</span>
                      ) : course.free ? (
                        <span>دخول الدورة مجاناً ➔</span>
                      ) : (
                        <>
                          <span>اشتركي الآن في الدورة ({course.price.ar})</span>
                          <ExternalLink className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#718079]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>تسجيل آمن وتفعيل فوري للدورة في حسابك الشخصي مع شهادة إتمام.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* MOBILE VIEW (< 768px): تجربة شيت أصلية متكاملة وفائقة السلاسة */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div className="md:hidden flex flex-col w-full h-full bg-white relative">
              {/* Native Header Bar */}
              <div className="shrink-0 bg-white/95 backdrop-blur-md border-b border-[rgba(127,169,155,0.15)] px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--cream)] text-[var(--sage-dark)] border border-[rgba(127,169,155,0.2)]">
                  {getCategoryLabel()}
                </span>

                {/* Drag Handle in center */}
                <div className="w-10 h-1.5 rounded-full bg-stone-300" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="إغلاق"
                  className="w-8 h-8 rounded-full bg-stone-100 active:bg-stone-200 text-stone-700 flex items-center justify-center border border-black/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {/* Mobile Hero Image Carousel with Touch Swipe */}
                <div
                  className="relative w-full h-64 bg-[#FAF8F5] border-b border-[rgba(127,169,155,0.12)] flex items-center justify-center overflow-hidden touch-pan-y"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {hasImages && currentImage ? (
                    <img
                      key={currentImage}
                      src={currentImage}
                      alt={course.title.ar}
                      className="w-full h-full max-h-60 object-contain p-3 select-none transition-all duration-300 animate-in fade-in"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white"
                      style={{
                        background:
                          course.gradient ||
                          "linear-gradient(135deg, var(--sage-dark), var(--sage))",
                      }}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs shadow-md flex items-center justify-center mb-2">
                        <BookOpen size={32} className="text-white" />
                      </div>
                      <span className="font-bold text-sm text-white">
                        {course.title.ar}
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  {course.badge?.ar && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--sage-dark)] shadow-sm z-20 border border-[rgba(127,169,155,0.25)]">
                      {course.badge.ar}
                    </span>
                  )}

                  {/* Mobile Counter Pill */}
                  {displayImages.length > 1 && (
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs z-20">
                      {selectedImageIndex + 1} من {displayImages.length}
                    </div>
                  )}

                  {/* Swipe hint dots for mobile */}
                  {displayImages.length > 1 && (
                    <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
                      {displayImages.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            selectedImageIndex === idx
                              ? "w-5 bg-[var(--sage-dark)]"
                              : "w-1.5 bg-black/25"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Thumbnails Row (Tap to preview) */}
                {displayImages.length > 1 && (
                  <div className="flex items-center gap-2 p-2.5 px-4 bg-[#FBF9F5] border-b border-[rgba(127,169,155,0.12)] overflow-x-auto scrollbar-none">
                    {displayImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          selectedImageIndex === idx
                            ? "border-[var(--sage-dark)] ring-2 ring-[var(--sage)]/40 scale-105"
                            : "border-stone-200 opacity-60"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`صورة ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Mobile Content Details */}
                <div className="p-4 sm:p-5 space-y-4 pb-6">
                  {/* Title & Price */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h1 className="text-xl font-black text-[var(--text-dark)] leading-snug flex-1">
                        {course.title.ar}
                      </h1>
                      <span className="text-xl font-black text-[var(--sage-dark)] shrink-0">
                        {course.price.ar}
                      </span>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="p-3.5 rounded-2xl bg-[var(--cream)]/60 border border-[rgba(127,169,155,0.15)]">
                    <h3 className="text-xs font-bold text-[var(--sage-dark)] mb-1">
                      نبذة عن محتوى البرنامج:
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-line">
                      {extendedDesc}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-dark)] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>ماذا ستتعلمين في هذه الدورة؟</span>
                    </h3>
                    <div className="space-y-2 pt-1">
                      {featuresList.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-stone-100 shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-xs text-[var(--text-body)] leading-relaxed">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Curriculum Breakdown */}
                  {course.lessons && course.lessons.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-dark)] flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-[var(--sage-dark)]" />
                          <span>محاور وفهرس الدورة</span>
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--cream)] text-[var(--sage-dark)]">
                          {course.lessons.length} دروس فيديو
                        </span>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {course.lessons.map((lesson, idx) => (
                          <div
                            key={lesson.id}
                            className="p-2.5 rounded-xl border border-stone-100 bg-[#FAF8F5] flex items-center justify-between gap-2.5 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-white border border-stone-200 text-[10px] font-bold text-stone-600 flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-stone-800 truncate text-[11px]">
                                {lesson.titleAr}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {lesson.duration && (
                                <span className="text-[10px] text-stone-500 font-medium">
                                  {lesson.duration}
                                </span>
                              )}
                              {lesson.isFreePreview && (
                                <button
                                  type="button"
                                  onClick={() => handlePreviewLesson(lesson.id)}
                                  className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold"
                                >
                                  معاينة 👁️
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specs: Clean spacious horizontal items on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)]">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Clock className="w-4 h-4 text-[var(--sage-dark)]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-muted)]">المدة</span>
                        <span className="text-xs font-bold text-[var(--text-dark)]">
                          {course.duration.ar}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)]">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Video className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-muted)]">صيغة الحضور</span>
                        <span className="text-xs font-bold text-[var(--text-dark)]">
                          أونلاين بالكامل
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)]">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <InfinityIcon className="w-4 h-4 text-[var(--sage-dark)]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-muted)]">صلاحية الوصول</span>
                        <span className="text-xs font-bold text-[var(--text-dark)]">
                          وصول مستمر مدى الحياة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trust Guarantee Note */}
                  <div className="flex items-center gap-2 text-[11px] text-[#718079] p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>تسجيل آمن وتفعيل فوري للدورة في حسابك الشخصي مع شهادة إتمام.</span>
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Action Bar (Shrink-0: Always in view, never cut off) */}
              <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-[rgba(127,169,155,0.2)] p-3 px-4 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">سعر الاشتراك</span>
                  <span className="text-base font-black text-[var(--sage-dark)] leading-tight">
                    {course.price.ar}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleActionClick}
                    className="w-full py-3 px-5 rounded-xl bg-[var(--sage-dark)] active:bg-[var(--text-dark)] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>جاري التحويل...</span>
                    ) : isEnrolled ? (
                      <span>دخول الدورة ومتابعة التعلّم ➔</span>
                    ) : course.free ? (
                      <span>دخول الدورة مجاناً ➔</span>
                    ) : (
                      <>
                        <span>اشتركي الآن في الدورة</span>
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
