import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Clock, Users, BookOpen, Check } from "lucide-react";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { useAuth } from "@/hooks/use-auth";
import { apiJson } from "@/lib/api";
import { SoftBlob, SectionDivider } from "@/components/section-divider";
import { EnrollConfirmModal, type CourseSummary } from "@/components/enroll-confirm-modal";

type CourseCard = {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  category: "course" | "workshop" | "free";
  duration: Bilingual;
  students: string;
  price: Bilingual;
  badge?: Bilingual;
  gradient: string;
  imageUrl?: string;
};

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
          category: CourseCard["category"];
          duration: number | string | null;
          students: string | null;
          price: string | number | null;
          imageUrl: string | null;
          status: string | null;
          gradient: string | null;
        }>>("/courses");

        if (cancelled) return;

        setCourses(
          data
            .filter((course) => course.status !== "hidden")
            .map((course) => ({
              id: course.id,
              title: tx(course.titleAr, course.titleEn),
              desc: tx(course.descAr ?? "", course.descAr ?? ""),
              category: course.category,
              duration: tx(
                formatCourseDuration(course.category, course.duration),
                formatCourseDuration(course.category, course.duration),
              ),
              students: course.students ?? "—",
              price: tx(formatCoursePrice(course.price), formatCoursePrice(course.price)),
              badge: course.category === "free" ? tx("مجاني", "Free") : undefined,
              gradient: course.gradient ?? getCourseGradient(course.category),
              imageUrl: course.imageUrl ?? undefined,
            })),
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
  const enrolledIds = new Set(user?.enrolledCourses.map((c) => c.id) ?? []);

  return (
    <div ref={ref} key={lang} className="lang-fade">
      <section className="relative overflow-hidden" style={{ background: "var(--cream)" }}>
        <SoftBlob
          color="var(--sage-light)"
          className="absolute -top-20 -start-16 w-[380px] h-[380px] opacity-40 animate-drift pointer-events-none"
        />
        <div className="relative container mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-12">
          <div className="text-center max-w-2xl mx-auto reveal">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("دورات وورش", "Courses & workshops"))}
            </p>
            <h1 className="text-4xl md:text-6xl leading-[1.1] mb-5">
              {t(tx("برامج تربوية لأمّ متمكّنة", "Programs for an empowered mother"))}
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "اختاري ما يناسب رحلتك من بين دوراتنا، ورشنا الحيّة، ومحتوانا المجاني.",
                  "Pick what fits your journey from our courses, live workshops, and free resources.",
                ),
              )}
            </p>
          </div>
        </div>
        <SectionDivider color="var(--cream-dark)" />
      </section>

      <section style={{ background: "var(--cream-dark)" }}>
        <div className="container mx-auto px-5 md:px-8 py-16 md:py-24">
          <div
            className="reveal flex flex-wrap justify-center gap-2 p-2 rounded-full mx-auto w-fit mb-12"
            style={{ background: "var(--white)", border: "1px solid rgba(127,169,155,0.25)" }}
          >
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: active ? "var(--sage-dark)" : "transparent",
                    color: active ? "white" : "var(--text-body)",
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
              const handleClick = () => {
                if (enrolled) {
                  navigate("/account?tab=courses");
                  return;
                }
                setEnrollFor({ id: c.id, title: c.title, price: c.price, free: c.category === "free" });
              };

              return (
                <article key={c.id} className="glass-card overflow-hidden flex flex-col reveal" data-reveal-delay={i * 80} style={{ background: "var(--white)" }}>
                  <div className="h-44 relative overflow-hidden">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={t(c.title)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: c.gradient }} />
                    )}
                    <SoftBlob color="rgba(255,255,255,0.18)" className="absolute -top-10 -end-10 w-[200px] h-[200px] animate-float pointer-events-none" />
                    <div className="absolute bottom-4 start-4 flex items-center gap-2">
                      <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)", color: "var(--sage-dark)" }}>
                        <BookOpen size={18} />
                      </span>
                    </div>
                    {enrolled ? (
                      <span className="absolute top-4 end-4 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1" style={{ background: "var(--sage-dark)", color: "white" }}>
                        <Check size={12} />
                        {t(tx("مسجّلة", "Enrolled"))}
                      </span>
                    ) : c.badge ? (
                      <span className="absolute top-4 end-4 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--white)", color: "var(--sage-dark)" }}>
                        {t(c.badge)}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl mb-2">{t(c.title)}</h3>
                    <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--text-body)" }}>
                      {t(c.desc)}
                    </p>
                    <div className="flex items-center justify-between gap-3 text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} /> {t(c.duration)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={14} /> {c.students}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-lg" style={{ color: "var(--sage-dark)" }}>
                        {t(c.price)}
                      </span>
                      <button type="button" onClick={handleClick} className="pill-btn pill-btn-primary text-sm py-2 px-5">
                        {enrolled
                          ? t(tx("استمري", "Continue"))
                          : t(c.category === "free" ? tx("ابدئي مجاناً", "Start free") : tx("اشتركي الآن", "Enroll now"))}
                      </button>
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

      <EnrollConfirmModal course={enrollFor} isOpen={!!enrollFor} onClose={() => setEnrollFor(null)} />
    </div>
  );
}

function formatCourseDuration(category: CourseCard["category"], duration: number | string | null) {
  if (category === "free") return "PDF";
  const value = typeof duration === "number" ? duration : Number(duration ?? 0);
  if (category === "workshop") return `${value || 0} دقيقة`;
  return `${value || 0} أسابيع`;
}

function formatCoursePrice(price: string | number | null) {
  const value = price ?? 0;
  if (String(value) === "0") return "مجاناً";
  return `${value} ريال`;
}

function getCourseGradient(category: CourseCard["category"]) {
  if (category === "course") return "linear-gradient(135deg, var(--sage-dark), var(--sage))";
  if (category === "workshop") return "linear-gradient(135deg, var(--blush), var(--blush-light))";
  return "linear-gradient(135deg, var(--sage-light), var(--sage-muted))";
}
