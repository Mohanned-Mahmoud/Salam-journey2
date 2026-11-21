import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Download,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  FileText,
  Smartphone,
  Zap,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";

export interface ProductModalData {
  id: string;
  title: { ar: string; en: string };
  desc: { ar: string; en: string };
  details?: { ar: string; en: string };
  features?: string[];
  badge?: { ar: string; en: string } | null;
  price: { ar: string; en: string };
  rawPrice: number;
  free: boolean;
  type: string;
  imageUrl?: string | null;
  images?: string[];
  Icon?: React.ComponentType<{ size?: number }>;
  gradient?: string;
  downloadUrl?: string | null;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductModalData | null;
  onBuy: (product: ProductModalData) => void;
  isProcessing?: boolean;
  isPurchased?: boolean;
  initialExpanded?: boolean;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onBuy,
  isProcessing = false,
  isPurchased = false,
  initialExpanded = false,
}: ProductDetailModalProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Touch swipe support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Reset state when opening a new product
  useEffect(() => {
    if (isOpen) {
      // On mobile screens (< 768px), open directly in the complete rich view for effortless mobile UX
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      setIsExpanded(isMobile ? true : initialExpanded);
      setSelectedImageIndex(0);
      setTouchStart(null);
      setTouchEnd(null);
    }
  }, [isOpen, product?.id, initialExpanded]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
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

  if (!isOpen || !product) return null;

  // Build full images list (fallback to imageUrl or gradient illustration)
  const rawImages =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
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

  // Features list
  const featuresList =
    product.features && product.features.length > 0
      ? product.features
      : [
        "ملف رقمي عالي الدقة (300 DPI) مناسب للقراءة والطباعة",
        "تصميم هادئ وعملي يراعي راحة الأم وسلاسة الاستخدام",
        "متوافق مع الهواتف الذكية والأجهزة اللوحية وتطبيقات الملاحظات",
        "تحميل مباشر وفوري مع صلاحية استخدام دائمة",
      ];

  const extendedDesc = product.details?.ar || product.desc.ar;

  const getProductTypeLabel = () => {
    if (product.type === "printable") return "مطبوعات وأوراق عمل";
    if (product.type === "guide") return "دليل إرشادي";
    return "ملف رقمي (PDF)";
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
        className={`relative bg-white w-full shadow-2xl overflow-hidden z-10 transition-all duration-300 ease-out flex flex-col ${isExpanded
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
                  product.gradient || "linear-gradient(135deg, var(--sage-light), var(--sage-muted))",
              }}
              onClick={() => setIsExpanded(true)}
            >
              {hasImages && currentImage ? (
                <img
                  src={currentImage}
                  alt={product.title.ar}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[var(--sage-dark)]">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-white/85 shadow-sm flex items-center justify-center mb-2">
                    {product.Icon ? <product.Icon size={34} /> : <ShoppingBag size={34} />}
                  </div>
                </div>
              )}

              {/* Badge Tag */}
              {product.badge?.ar && (
                <span className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-[var(--sage-dark)] shadow-sm border border-[rgba(127,169,155,0.2)]">
                  {product.badge.ar}
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
                    {product.free ? "إصدار مجاني" : getProductTypeLabel()}
                  </span>
                  <span className="text-xl font-extrabold text-[var(--sage-dark)]">
                    {product.price.ar}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-dark)] mb-2.5 leading-snug">
                  {product.title.ar}
                </h2>

                <p className="text-xs sm:text-sm text-[var(--text-body)] leading-relaxed mb-6 whitespace-pre-wrap">
                  {product.desc.ar}
                </p>
              </div>

              {/* Action Buttons: عرض التفاصيل + شراء */}
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

                {/* Primary Button: شراء المنتج */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onBuy(product)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>جاري التحويل...</span>
                  ) : isPurchased || product.free ? (
                    <>
                      <span>فتح / تنزيل</span>
                      <Download className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>شراء الآن ({product.price.ar})</span>
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
              {/* RIGHT SIDE (Desktop): معرض الصور الموسع */}
              <div className="w-1/2 relative bg-[#FBF9F5] flex flex-col p-6 shrink-0 border-l border-[rgba(127,169,155,0.18)] overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden bg-white border border-[rgba(127,169,155,0.2)] shadow-xs flex items-center justify-center flex-1 min-h-0 group">
                  {hasImages && currentImage ? (
                    <img
                      key={currentImage}
                      src={currentImage}
                      alt={product.title.ar}
                      className="w-full h-full object-contain p-3 transition-all duration-300 ease-out"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
                      style={{
                        background:
                          product.gradient ||
                          "linear-gradient(135deg, var(--sage-light), var(--cream))",
                      }}
                    >
                      <div className="w-20 h-20 rounded-3xl bg-white/90 shadow-md flex items-center justify-center mb-2">
                        {product.Icon ? <product.Icon size={40} /> : <ShoppingBag size={40} />}
                      </div>
                      <span className="font-extrabold text-base text-[var(--text-dark)]">
                        {product.title.ar}
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  {product.badge?.ar && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--sage-dark)] shadow-sm z-30 border border-[rgba(127,169,155,0.25)]">
                      {product.badge.ar}
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
                        className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${selectedImageIndex === idx
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

              {/* LEFT SIDE (Desktop): التفاصيل الموسعة الكاملة مع شريط إجراءات ثابت */}
              <div className="w-1/2 flex flex-col h-full bg-white relative z-10 overflow-hidden">
                {/* Scrollable Details Body */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-7 space-y-4">
                  {/* Top Header Row with Category, Price, and Close Button */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--cream)] text-[var(--sage-dark)] border border-[rgba(127,169,155,0.2)]">
                      {getProductTypeLabel()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-[var(--sage-dark)]">
                        {product.price.ar}
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
                    {product.title.ar}
                  </h1>

                  {/* Description */}
                  <div className="p-4 rounded-2xl bg-[var(--cream)]/50 border border-[rgba(127,169,155,0.18)]">
                    <h3 className="text-xs font-bold text-[var(--sage-dark)] mb-1.5">
                      نبذة عن هذا المنتج:
                    </h3>
                    <p className="text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-line">
                      {extendedDesc}
                    </p>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--text-dark)] mb-2.5 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>ماذا يتضمن هذا المنتج وكيف يفيدك؟</span>
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

                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-2xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)] text-center">
                      <FileText className="w-4 h-4 text-[var(--sage-dark)] mx-auto mb-1" />
                      <span className="block text-[10px] text-[var(--text-muted)]">الصيغة</span>
                      <span className="block text-xs font-bold text-[var(--text-dark)]">
                        PDF عالي الدقة
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)] text-center">
                      <Zap className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                      <span className="block text-[10px] text-[var(--text-muted)]">التسليم</span>
                      <span className="block text-xs font-bold text-[var(--text-dark)]">
                        فوري ومباشر
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)] text-center">
                      <Smartphone className="w-4 h-4 text-[var(--sage-dark)] mx-auto mb-1" />
                      <span className="block text-[10px] text-[var(--text-muted)]">التوافق</span>
                      <span className="block text-xs font-bold text-[var(--text-dark)]">
                        الهاتف والطباعة
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
                      onClick={() => onBuy(product)}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white font-black text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? (
                        <span>جاري التحويل...</span>
                      ) : isPurchased || product.free ? (
                        <>
                          <span>فتح / تنزيل الملف الآن</span>
                          <Download className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>شراء الآن ({product.price.ar})</span>
                          <ExternalLink className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#718079]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>دفع آمن ومشفّر بالكامل مع تحميل مباشر للملفات.</span>
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
                  {getProductTypeLabel()}
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
                      alt={product.title.ar}
                      className="w-full h-full max-h-60 object-contain p-3 select-none transition-all duration-300 animate-in fade-in"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
                      style={{
                        background:
                          product.gradient ||
                          "linear-gradient(135deg, var(--sage-light), var(--cream))",
                      }}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white/90 shadow-md flex items-center justify-center mb-2">
                        {product.Icon ? <product.Icon size={32} /> : <ShoppingBag size={32} />}
                      </div>
                      <span className="font-bold text-sm text-[var(--text-dark)]">
                        {product.title.ar}
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  {product.badge?.ar && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--sage-dark)] shadow-sm z-20 border border-[rgba(127,169,155,0.2)]">
                      {product.badge.ar}
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
                          className={`h-1.5 rounded-full transition-all duration-300 ${selectedImageIndex === idx
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
                        className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${selectedImageIndex === idx
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
                        {product.title.ar}
                      </h1>
                      <span className="text-xl font-black text-[var(--sage-dark)] shrink-0">
                        {product.price.ar}
                      </span>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="p-3.5 rounded-2xl bg-[var(--cream)]/60 border border-[rgba(127,169,155,0.15)]">
                    <h3 className="text-xs font-bold text-[var(--sage-dark)] mb-1">
                      نبذة عن المنتج:
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-line">
                      {extendedDesc}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-dark)] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>ماذا يتضمن هذا المنتج وكيف يفيدك؟</span>
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

                  {/* Specs: Clean spacious horizontal items on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)]">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <FileText className="w-4 h-4 text-[var(--sage-dark)]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-muted)]">الصيغة</span>
                        <span className="text-xs font-bold text-[var(--text-dark)]">
                          PDF عالي الدقة (300 DPI)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)]">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Zap className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-muted)]">التسليم</span>
                        <span className="text-xs font-bold text-[var(--text-dark)]">
                          فوري ومباشر بعد الشراء
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--cream)]/40 border border-[rgba(127,169,155,0.15)]">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Smartphone className="w-4 h-4 text-[var(--sage-dark)]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-muted)]">التوافق</span>
                        <span className="text-xs font-bold text-[var(--text-dark)]">
                          الهواتف والتابلت والطباعة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trust Guarantee Note */}
                  <div className="flex items-center gap-2 text-[11px] text-[#718079] p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>دفع آمن ومشفّر بالكامل مع تحميل مباشر فوري للملفات.</span>
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Action Bar (Shrink-0: Always in view, never cut off) */}
              <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-[rgba(127,169,155,0.2)] p-3 px-4 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">السعر المطلوب</span>
                  <span className="text-base font-black text-[var(--sage-dark)] leading-tight">
                    {product.price.ar}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onBuy(product)}
                    className="w-full py-3 px-5 rounded-xl bg-[var(--sage-dark)] active:bg-[var(--text-dark)] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>جاري التحويل...</span>
                    ) : isPurchased || product.free ? (
                      <>
                        <span>فتح / تنزيل الملف</span>
                        <Download className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>شراء الآن ({product.price.ar})</span>
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
