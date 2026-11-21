import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Award,
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
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsExpanded(initialExpanded);
      setSelectedImageIndex(0);
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

  const rawImages = (course.images && course.images.length > 0)
    ? course.images
    : (course.imageUrl ? [course.imageUrl] : []);

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

  const featuresList = (course.features && course.features.length > 0)
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
            ? "max-h-[92vh] sm:max-h-[90vh] md:h-[86vh] max-w-full md:max-w-5xl lg:max-w-6xl rounded-t-[28px] sm:rounded-3xl"
            : "max-h-[90vh] max-w-full sm:max-w-md md:max-w-lg rounded-t-[28px] sm:rounded-3xl"
        }`}
        style={{
          boxShadow: "0 25px 60px -15px rgba(26, 46, 42, 0.4)",
          border: "1px solid rgba(127, 169, 155, 0.2)",
        }}
      >
        {/* Mobile Swipe Drag Indicator Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Top Accent Gradient Bar */}
        <div className="h-1 bg-gradient-to-r from-[var(--sage)] via-[var(--sage-dark)] to-[var(--blush)] shrink-0" />

        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-40 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-[var(--text-dark)] flex items-center justify-center shadow-md transition-all hover:scale-105 border border-black/5"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MODE 1: COMPACT QUICK VIEW (قبل الضغط على عرض التفاصيل)       */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {!isExpanded ? (
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Visual Cover / Image Header */}
            <div
              className="h-48 sm:h-56 relative shrink-0 overflow-hidden flex items-center justify-center"
              style={{ background: course.gradient || "linear-gradient(135deg, var(--sage-dark), var(--sage))" }}
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
                  onClick={() => onEnroll(course)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>جاري التحويل...</span>
                  ) : isEnrolled ? (
                    <span>استمري في الدورة 🌿</span>
                  ) : course.free ? (
                    <span>ابدئي مجاناً الآن</span>
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
          /* MODE 2: EXPANDED VIEW (شاشة مقسمة للاب وسلسة للموبايل)        */
          /* ══════════════════════════════════════════════════════════════ */
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative">
            {/* ──────────────────────────────────────────────────────────── */}
            {/* RIGHT SIDE (الجزء اليمين): معرض صور الدورة والمحاور           */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div className="w-full md:w-1/2 relative bg-[#FBF9F5] flex flex-col justify-between p-3.5 sm:p-5 md:p-6 shrink-0 border-b md:border-b-0 md:border-l border-[rgba(127,169,155,0.18)]">
              {/* Main Expanded Image View */}
              <div className="relative rounded-2xl overflow-hidden bg-white border border-[rgba(127,169,155,0.2)] shadow-xs flex items-center justify-center min-h-[220px] sm:min-h-[280px] md:min-h-[380px] md:flex-1 group">
                {hasImages && currentImage ? (
                  <img
                    key={currentImage}
                    src={currentImage}
                    alt={course.title.ar}
                    className="w-full h-full object-contain max-h-[240px] sm:max-h-[320px] md:max-h-[440px] p-2 transition-all duration-500 ease-out animate-in fade-in zoom-in-95"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white"
                    style={{ background: course.gradient || "linear-gradient(135deg, var(--sage-dark), var(--sage))" }}
                  >
                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xs shadow-md flex items-center justify-center mb-2">
                      <BookOpen size={40} className="text-white" />
                    </div>
                    <span className="font-extrabold text-base text-white">{course.title.ar}</span>
                  </div>
                )}

                {/* Badge Overlay */}
                {course.badge?.ar && (
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--sage-dark)] shadow-sm z-30 border border-[rgba(127,169,155,0.25)]">
                    {course.badge.ar}
                  </span>
                )}

                {/* Gallery Prev / Next Controls */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      aria-label="الصورة السابقة"
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[var(--text-dark)] shadow-md flex items-center justify-center transition-all hover:scale-105 z-20 border border-black/5"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="الصورة التالية"
                      className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[var(--text-dark)] shadow-md flex items-center justify-center transition-all hover:scale-105 z-20 border border-black/5"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Counter Pill */}
                    <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 px-2.5 py-0.5 sm:py-1 rounded-full bg-black/60 text-white text-[11px] font-medium backdrop-blur-xs z-10">
                      {selectedImageIndex + 1} / {displayImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails Gallery Strip */}
              {displayImages.length > 1 && (
                <div className="mt-2.5 sm:mt-3 flex items-center gap-2 overflow-x-auto pb-1 px-0.5 scrollbar-thin">
                  {displayImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? "border-[var(--sage-dark)] ring-2 ring-[var(--sage)]/40 scale-105"
                          : "border-stone-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* LEFT SIDE (الجزء الشمال): التفاصيل الموسعة ومحاور الدورة        */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div className="w-full md:w-1/2 flex flex-col justify-between md:overflow-y-auto p-4 sm:p-6 md:p-8 bg-white relative z-10 pb-24 md:pb-8">
              <div className="space-y-4 sm:space-y-6">
                {/* Header: Title + Price + Category */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--cream)] text-[var(--sage-dark)] border border-[rgba(127,169,155,0.2)]">
                      {getCategoryLabel()}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[var(--sage-dark)]">
                      {course.price.ar}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--text-dark)] leading-snug">
                    {course.title.ar}
                  </h1>
                </div>

                {/* Extended Description */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--cream)]/50 border border-[rgba(127,169,155,0.18)]">
                  <h3 className="text-xs font-bold text-[var(--sage-dark)] mb-1.5">
                    نبذة عن محتوى البرنامج:
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-line">
                    {extendedDesc}
                  </p>
                </div>

                {/* Curriculum & Inclusions Checklist */}
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-dark)] mb-2.5 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>ماذا ستتعلمين في هذه الدورة؟</span>
                  </h3>
                  <ul className="space-y-2 sm:space-y-2.5">
                    {featuresList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[var(--text-body)]">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Course Specs Micro-Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 sm:p-3 rounded-2xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)] text-center">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--sage-dark)] mx-auto mb-1" />
                    <span className="block text-[10px] text-[var(--text-muted)]">المدة</span>
                    <span className="block text-[11px] sm:text-xs font-bold text-[var(--text-dark)]">{course.duration.ar}</span>
                  </div>

                  <div className="p-2 sm:p-3 rounded-2xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)] text-center">
                    <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 mx-auto mb-1" />
                    <span className="block text-[10px] text-[var(--text-muted)]">صيغة الحضور</span>
                    <span className="block text-[11px] sm:text-xs font-bold text-[var(--text-dark)]">أونلاين بالكامل</span>
                  </div>

                  <div className="p-2 sm:p-3 rounded-2xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)] text-center">
                    <InfinityIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--sage-dark)] mx-auto mb-1" />
                    <span className="block text-[10px] text-[var(--text-muted)]">صلاحية الوصول</span>
                    <span className="block text-[11px] sm:text-xs font-bold text-[var(--text-dark)]">مدى الحياة</span>
                  </div>
                </div>

                {/* Trust Guarantee Note */}
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#718079] p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>تسجيل آمن وتفعيل فوري للدورة في حسابك الشخصي مع شهادة إتمام.</span>
                </div>
              </div>

              {/* 
                DESKTOP BOTTOM ACTION BAR
              */}
              <div className="hidden md:flex pt-5 mt-6 border-t border-[rgba(127,169,155,0.18)] items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  title="العودة للعرض السريع"
                  className="py-3 px-4 rounded-2xl border border-[rgba(127,169,155,0.3)] bg-[var(--cream)] hover:bg-white text-[var(--text-dark)] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>تصغير</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onEnroll(course)}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>جاري التحويل...</span>
                  ) : isEnrolled ? (
                    <span>استمري في الدورة 🌿</span>
                  ) : course.free ? (
                    <span>ابدئي مجاناً الآن</span>
                  ) : (
                    <>
                      <span>اشتركي الآن في الدورة ({course.price.ar})</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 
              MOBILE STICKY BOTTOM ACTION BAR (فائق السلاسة على الموبايل)
            */}
            <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[rgba(127,169,155,0.2)] p-3 px-4 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] z-40 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] font-medium">سعر الاشتراك</span>
                <span className="text-base font-black text-[var(--sage-dark)] leading-tight">{course.price.ar}</span>
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="py-2.5 px-3 rounded-xl border border-[rgba(127,169,155,0.3)] bg-[var(--cream)] text-[var(--text-dark)] text-xs font-bold flex items-center gap-1"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onEnroll(course)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--sage-dark)] active:bg-[var(--text-dark)] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>جاري...</span>
                  ) : isEnrolled ? (
                    <span>استمري 🌿</span>
                  ) : course.free ? (
                    <span>ابدئي مجاناً</span>
                  ) : (
                    <>
                      <span>اشتركي الآن</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
