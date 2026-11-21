import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Clock, Users, BookOpen, Check, Sparkles } from "lucide-react";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { useAuth } from "@/hooks/use-auth";
import { apiJson, resolveMediaUrl } from "@/lib/api";
import { SoftBlob, SectionDivider } from "@/components/section-divider";
import { EnrollConfirmModal, type CourseSummary } from "@/components/enroll-confirm-modal";
import { CourseDetailModal, type CourseModalData } from "@/components/course-detail-modal";
import { PaymentModal, type PayableItem } from "@/components/payment-modal";

type CourseCard = CourseModalData;

const FILTERS = [
  { id: "all" as const, label: tx("الكل", "All") },
  { id: "course" as const, label: tx("دورات", "Courses") },
  { id: "workshop" as const, label: tx("ورش", "Workshops") },
  { id: "free" as const, label: tx("مجاناً", "Free") },
];

type FilterId = (typeof FILTERS)[number]["id"];

export default function Courses() {
  const ref = useReveal<HTMLDivElement>();
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterId>("all");
  const [enrollFor, setEnrollFor] = useState<CourseSummary | null>(null);
  const [paymentItem, setPaymentItem] = useState<PayableItem | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseCard | null>(null);
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        setLoading(true);
        const data = await apiJson<Array<{
          id: string;
          titleAr: string;
          titleEn: string;
          descAr: string | null;
          descEn: string | null;
          detailsAr?: string | null;
          detailsEn?: string | null;
          featuresAr?: string[] | null;
          featuresEn?: string[] | null;
          badgeAr?: string | null;
          badgeEn?: string | null;
          category: CourseModalData["category"];
          duration: number | string | null;
          students: string | null;
          price: string | number | null;
          imageUrl: string | null;
          images?: string[] | null;
          status: string | null;
          gradient: string | null;
          videoUrl?: string | null;
        }>>("/courses");

        if (cancelled) return;

        setCourses(
          data
            .filter((course) => course.status !== "hidden")
            .map((course) => {
              const rawImages = Array.isArray(course.images) && course.images.length > 0
                ? course.images
                : (course.imageUrl ? [course.imageUrl] : []);

              return {
                id: course.id,
                title: tx(course.titleAr, course.titleEn),
                desc: tx(course.descAr ?? "", course.descEn ?? course.descAr ?? ""),
                details: tx(course.detailsAr ?? course.descAr ?? "", course.detailsEn ?? course.descEn ?? course.descAr ?? ""),
                category: course.category,
                duration: tx(
                  formatCourseDuration(course.category, course.duration, "ar"),
                  formatCourseDuration(course.category, course.duration, "en"),
                ),
                students: course.students ?? "—",
                price: tx(formatCoursePrice(course.price, "ar"), formatCoursePrice(course.price, "en")),
                rawPrice: Number(course.price ?? 0),
                free: course.category === "free" || String(course.price ?? "0") === "0",
                badge: course.badgeAr
                  ? tx(course.badgeAr, course.badgeEn ?? course.badgeAr)
                  : (course.category === "free" ? tx("مجاني", "Free") : null),
                gradient: course.gradient ?? getCourseGradient(course.category),
                imageUrl: course.imageUrl ?? (rawImages[0] || null),
                images: rawImages,
                features: Array.isArray(course.featuresAr) ? course.featuresAr : [],
                videoUrl: course.videoUrl ?? null,
              };
            }),
        );
      } catch {
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => courses.filter((c) => filter === "all" || c.category === filter), [courses, filter]);

  const enrolledIds = useMemo(() => {
    return new Set(user?.enrolledCourses?.map((c) => c.id) || []);
  }, [user]);

  const handleEnrollAction = (c: CourseModalData) => {
    const enrolled = enrolledIds.has(c.id);
    if (enrolled) {
      navigate("/account?tab=courses");
      return;
    }
    if (c.free) {
      setEnrollFor({
        id: c.id,
        title: c.title,
        price: c.price,
        rawPrice: c.rawPrice,
        free: c.free,
      });
      return;
    }
    // Paid course: open payment modal with InstaPay (EGP) and Stripe Card options
    setPaymentItem({
      id: c.id,
      type: "course",
      title: c.title.ar,
      priceUsd: c.rawPrice,
      imageUrl: c.imageUrl,
    });
  };

  return (
    <div ref={ref} className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 bg-gradient-radial from-[var(--cream)] via-transparent to-transparent opacity-70 pointer-events-none" />
        <div className="relative container mx-auto px-5 md:px-8 text-center max-w-3xl">
          <span className="badge-soft mb-4 inline-block reveal">
            {t(tx("رحلة التعلّم والنمو", "Learning & Growth Journey"))}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 reveal" data-reveal-delay="100">
            {t(tx("دورات وورش عمل للأم الواعية", "Courses & Workshops for the Mindful Mother"))}
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-body)] leading-relaxed reveal" data-reveal-delay="200">
            {t(
              tx(
                "محتوى علمي وتربوي متدرج ومبسّط، مبني على أسس نفسية واقعية، ليرافقك في كل خطوة من رحلة أمومتك.",
                "Gradual, accessible parenting and educational content grounded in psychological principles, accompanying you at every step of your motherhood journey.",
              ),
            )}
          </p>
        </div>
        <SectionDivider color="var(--blush-light)" />
      </section>

      {/* Courses Grid Section */}
      <section style={{ background: "var(--blush-light)" }} className="relative">
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" aria-hidden />
        <div className="relative container mx-auto px-5 md:px-8 py-16 md:py-24">
          {/* Filters */}
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-12 flex-wrap">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer"
                  style={{
                    background: active ? "var(--sage-dark)" : "var(--white)",
                    color: active ? "white" : "var(--text-body)",
                    boxShadow: active ? "0 4px 12px rgba(45,74,69,0.15)" : "none",
                  }}
                >
                  {t(f.label)}
                </button>
              );
            })}
          </div>

          {loading && (
            <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>
              {t(tx("جارٍ تحميل الدورات...", "Loading courses..."))}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {visible.map((c, i) => {
              const enrolled = enrolledIds.has(c.id);

              return (
                <article
                  key={c.id}
                  className="glass-card overflow-hidden flex flex-col reveal"
                  data-reveal-delay={i * 80}
                  style={{ background: "var(--white)" }}
                >
                  {/* Card Visual Header (Clickable to open modal) */}
                  <div
                    className="h-44 relative overflow-hidden cursor-pointer group bg-[var(--cream)]"
                    onClick={() => setSelectedCourse(c)}
                  >
                    {c.imageUrl ? (
                      <img
                        src={resolveMediaUrl(c.imageUrl)}
                        alt={t(c.title)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: c.gradient }} />
                    )}
                    <SoftBlob
                      color="rgba(255,255,255,0.18)"
                      className="absolute -top-10 -end-10 w-[200px] h-[200px] animate-float pointer-events-none"
                    />
                    <div className="absolute bottom-4 start-4 flex items-center gap-2">
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-xs"
                        style={{ background: "rgba(255,255,255,0.85)", color: "var(--sage-dark)" }}
                      >
                        <BookOpen size={18} />
                      </span>
                    </div>

                    {enrolled ? (
                      <span
                        className="absolute top-4 end-4 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
                        style={{ background: "var(--sage-dark)", color: "white" }}
                      >
                        <Check size={12} />
                        {t(tx("مسجّلة", "Enrolled"))}
                      </span>
                    ) : c.badge ? (
                      <span
                        className="absolute top-4 end-4 px-3 py-1 rounded-full text-xs font-bold shadow-xs"
                        style={{ background: "var(--white)", color: "var(--sage-dark)" }}
                      >
                        {t(c.badge)}
                      </span>
                    ) : null}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3
                      className="text-xl mb-2 cursor-pointer hover:underline"
                      onClick={() => setSelectedCourse(c)}
                    >
                      {t(c.title)}
                    </h3>
                    <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--text-body)" }}>
                      {t(c.desc)}
                    </p>
                    <div className="flex items-center justify-between gap-3 text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Clock size={14} className="text-[var(--sage-dark)]" /> {t(c.duration)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Users size={14} className="text-[var(--sage-dark)]" /> {c.students}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[rgba(127,169,155,0.12)]">
                      <span className="font-bold text-lg" style={{ color: "var(--sage-dark)" }}>
                        {t(c.price)}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Secondary View Details Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedCourse(c)}
                          className="py-2 px-3 rounded-xl border border-[rgba(127,169,155,0.3)] bg-[var(--cream)] hover:bg-white text-xs font-bold text-[var(--text-dark)] flex items-center gap-1 transition-colors"
                        >
                          <Sparkles size={13} className="text-amber-600" />
                          <span>تفاصيل</span>
                        </button>

                        {/* Main CTA */}
                        <button
                          type="button"
                          onClick={() => handleEnrollAction(c)}
                          className="pill-btn pill-btn-primary text-sm py-2 px-4"
                        >
                          {enrolled
                            ? t(tx("استمري", "Continue"))
                            : t(c.free ? tx("ابدئي مجاناً", "Start free") : tx("اشتركي", "Enroll"))}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && visible.length === 0 && (
            <p className="text-center mt-12" style={{ color: "var(--text-muted)" }}>
              {t(tx("لا توجد نتائج لهذا التصنيف.", "No results in this category."))}
            </p>
          )}
        </div>
      </section>

      {/* Interactive Rich Course Detail Modal (Split View on Laptop, Bottom Sheet on Mobile, No Smoky Blur) */}
      <CourseDetailModal
        isOpen={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
        course={selectedCourse}
        isEnrolled={selectedCourse ? enrolledIds.has(selectedCourse.id) : false}
        onEnroll={(courseData) => {
          setSelectedCourse(null);
          handleEnrollAction(courseData);
        }}
      />

      {/* Enrollment & Payment Confirmation Modal (Free Courses) */}
      <EnrollConfirmModal course={enrollFor} isOpen={!!enrollFor} onClose={() => setEnrollFor(null)} />

      {/* Payment Modal for Paid Courses (InstaPay Egypt + Stripe Card) */}
      <PaymentModal
        isOpen={Boolean(paymentItem)}
        onClose={() => setPaymentItem(null)}
        item={paymentItem}
      />
    </div>
  );
}

function formatCourseDuration(category: CourseModalData["category"], duration: number | string | null, lang: "ar" | "en") {
  if (category === "free") return "PDF";
  const value = typeof duration === "number" ? duration : Number(duration ?? 0);
  if (lang === "en") {
    if (category === "workshop") return `${value || 0} min`;
    return `${value || 0} weeks`;
  }
  if (category === "workshop") return `${value || 0} دقيقة`;
  return `${value || 0} أسابيع`;
}

function formatCoursePrice(price: string | number | null, lang: "ar" | "en") {
  const value = price ?? 0;
  if (String(value) === "0") return lang === "en" ? "Free" : "مجاناً";
  return `$${value}`;
}

function getCourseGradient(category: CourseModalData["category"]) {
  if (category === "course") return "linear-gradient(135deg, var(--sage-dark), var(--sage))";
  if (category === "workshop") return "linear-gradient(135deg, var(--blush), var(--blush-light))";
  return "linear-gradient(135deg, var(--sage-light), var(--sage-muted))";
}
