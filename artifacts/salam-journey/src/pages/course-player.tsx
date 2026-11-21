import { useEffect, useState, useMemo } from "react";
import { useRoute, useLocation, Link } from "wouter";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  FileText,
  Download,
  Share2,
  MessageCircle,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Clock,
  ShieldCheck,
  Check,
  Award,
  Video,
} from "lucide-react";
import { apiJson, resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, tx } from "@/lib/i18n";
import { resolveVideoSource, type ResolvedVideo } from "@/lib/video-resolver";
import { PaymentModal, type PayableItem } from "@/components/payment-modal";
import { CourseDetailModal, type CourseModalData } from "@/components/course-detail-modal";

interface CourseLesson {
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

interface CourseData {
  id: string;
  titleAr: string;
  titleEn?: string;
  descAr?: string;
  descEn?: string;
  detailsAr?: string;
  category: "course" | "workshop" | "free";
  price: string | number;
  duration: number | string;
  imageUrl?: string;
  images?: string[];
  gradient?: string;
  videoUrl?: string;
  lessons?: CourseLesson[];
  featuresAr?: string[];
  badgeAr?: string;
}

export default function CoursePlayer() {
  const [, params] = useRoute("/courses/:id/learn");
  const [, fallbackParams] = useRoute("/courses/:id");
  const courseId = params?.id || fallbackParams?.id;
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t, lang } = useLanguage();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active lesson ID
  const [activeLessonId, setActiveLessonId] = useState<string>("");

  // Completed lesson IDs
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [markingProgress, setMarkingProgress] = useState(false);

  // Modals & Drawers
  const [showMobilePlaylist, setShowMobilePlaylist] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "attachments" | "support">("overview");
  const [paymentItem, setPaymentItem] = useState<PayableItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Direct video signed download URL cache (if R2 signed URL is needed)
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Anti-Inspect Keyboard Guard: blocks F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12 (DevTools)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Block Ctrl+Shift+I / J / C (DevTools Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      // Block Ctrl+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && ["U", "u"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      // Block Ctrl+S (Save Page or Media)
      if ((e.ctrlKey || e.metaKey) && ["S", "s"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check enrollment
  const isEnrolled = useMemo(() => {
    if (!course) return false;
    if (course.category === "free" || Number(course.price || 0) === 0) return true;
    if (!user || !user.enrolledCourses) return false;
    return user.enrolledCourses.some((c) => c.id === course.id);
  }, [user, course]);

  // Load Course & User progress
  useEffect(() => {
    if (!courseId) return;
    let isCancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch course details
        const data = await apiJson<CourseData>(`/courses/${courseId}`);
        if (isCancelled) return;

        // Ensure default lesson if none exist
        const rawLessons = Array.isArray(data.lessons) ? data.lessons : [];
        let finalLessons = [...rawLessons];

        if (finalLessons.length === 0) {
          finalLessons = [
            {
              id: "intro-lesson-1",
              titleAr: "المحور التمهيدي: نظرة شاملة وتطبيق عملي",
              titleEn: "Introduction & Practical Overview",
              duration: "15:00 د",
              videoUrl: data.videoUrl || "",
              descriptionAr:
                data.descAr ||
                "مرحباً بكِ في هذه الدورة. يتناول هذا المحور الأساسيات والتطبيقات التمهيدية للانطلاق بثقة ووعي.",
              isFreePreview: true,
            },
          ];
        }

        setCourse({ ...data, lessons: finalLessons });

        // Select initial lesson from URL param or first incomplete lesson
        const urlParams = new URLSearchParams(window.location.search);
        const requestedLesson = urlParams.get("lesson");
        if (requestedLesson && finalLessons.some((l) => l.id === requestedLesson)) {
          setActiveLessonId(requestedLesson);
        } else {
          setActiveLessonId(finalLessons[0]?.id || "");
        }

        // Fetch user progress if logged in
        if (user?.id) {
          try {
            const enrolledList = await apiJson<any[]>(`/courses/enrolled/${user.id}`);
            const thisEnroll = enrolledList.find((e) => e.id === courseId);
            if (thisEnroll && Array.isArray(thisEnroll.completedLessons)) {
              setCompletedLessonIds(thisEnroll.completedLessons);
            }
          } catch {
            // Non-blocking
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "تعذر تحميل الدورة. يرجى المحاولة لاحقاً.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    void fetchData();
    return () => {
      isCancelled = true;
    };
  }, [courseId, user?.id]);

  // Active Lesson
  const lessons = useMemo(() => course?.lessons || [], [course?.lessons]);
  const activeLessonIndex = useMemo(
    () => lessons.findIndex((l) => l.id === activeLessonId),
    [lessons, activeLessonId]
  );
  const activeLesson = lessons[activeLessonIndex] || lessons[0];

  // Resolve video for active lesson
  const resolvedVideo: ResolvedVideo = useMemo(() => {
    if (!activeLesson) return { type: "unknown", isEmbed: false };
    return resolveVideoSource(activeLesson.videoUrl || course?.videoUrl);
  }, [activeLesson, course?.videoUrl]);

  // Secure In-Memory Blob Streaming: loads via authenticated stream and converts to blob: URL
  // This completely conceals direct cloud storage endpoints and prevents opening or downloading in new tabs
  useEffect(() => {
    let cancelled = false;
    let activeBlob: string | null = null;
    setSignedVideoUrl(null);

    const videoSource = activeLesson?.videoUrl || course?.videoUrl;
    if (!videoSource || resolvedVideo.isEmbed) return;

    async function loadSecureStream() {
      if (videoSource.startsWith("courses/") || videoSource.startsWith("/api/courses/")) {
        setLoadingSignedUrl(true);
        try {
          const fileParam = videoSource.startsWith("courses/")
            ? videoSource
            : videoSource.split("fileKey=")[1] || videoSource;

          const streamUrl = `/api/courses/${courseId}/stream?fileKey=${encodeURIComponent(decodeURIComponent(fileParam))}`;
          const token = localStorage.getItem("token") || "";
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;
          if (user?.id) headers["X-User-Id"] = user.id;

          const res = await fetch(streamUrl, { headers });
          if (!res.ok) {
            throw new Error(`Failed to load video stream (${res.status})`);
          }

          const blob = await res.blob();
          if (!cancelled) {
            const blobUrl = URL.createObjectURL(blob);
            activeBlob = blobUrl;
            setSignedVideoUrl(blobUrl);
          }
        } catch (err) {
          console.warn("Blob conversion fallback to secure stream endpoint:", err);
          if (!cancelled) {
            setSignedVideoUrl(`/api/courses/${courseId}/stream?fileKey=${encodeURIComponent(videoSource)}`);
          }
        } finally {
          if (!cancelled) setLoadingSignedUrl(false);
        }
      } else {
        setSignedVideoUrl(resolveMediaUrl(videoSource));
      }
    }

    void loadSecureStream();

    return () => {
      cancelled = true;
      if (activeBlob) {
        URL.revokeObjectURL(activeBlob);
      }
    };
  }, [activeLesson?.id, activeLesson?.videoUrl, courseId, resolvedVideo.isEmbed, course?.videoUrl, user?.id]);

  // Check if active lesson is accessible
  const isLessonUnlocked = useMemo(() => {
    if (isEnrolled) return true;
    if (activeLesson?.isFreePreview) return true;
    return false;
  }, [isEnrolled, activeLesson]);

  // Overall progress calculation
  const progressPercentage = useMemo(() => {
    if (!lessons.length) return 0;
    const completedCount = completedLessonIds.filter((id) =>
      lessons.some((l) => l.id === id)
    ).length;
    return Math.min(100, Math.round((completedCount / lessons.length) * 100));
  }, [lessons, completedLessonIds]);

  // Toggle lesson completed
  const handleToggleComplete = async (lessonId: string) => {
    if (!user?.id) {
      alert("يرجى تسجيل الدخول لحفظ تقدمكِ في الدورة.");
      return;
    }

    const isCurrentlyCompleted = completedLessonIds.includes(lessonId);
    const nextCompleted = !isCurrentlyCompleted;

    // Optimistic UI update
    setCompletedLessonIds((prev) =>
      nextCompleted ? [...prev, lessonId] : prev.filter((id) => id !== lessonId)
    );

    try {
      setMarkingProgress(true);
      const res = await apiJson<{ success: boolean; progress: number; completedLessons: string[] }>(
        `/courses/${courseId}/progress`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: user.id,
            lessonId,
            completed: nextCompleted,
          }),
        }
      );
      if (res && Array.isArray(res.completedLessons)) {
        setCompletedLessonIds(res.completedLessons);
      }

      // Auto-advance to next lesson if just marked as complete
      if (nextCompleted && activeLessonIndex < lessons.length - 1) {
        const nextLesson = lessons[activeLessonIndex + 1];
        if (nextLesson) {
          setTimeout(() => {
            setActiveLessonId(nextLesson.id);
          }, 600);
        }
      }
    } catch (err: any) {
      console.error("Progress save failed:", err);
      // Revert on error
      setCompletedLessonIds((prev) =>
        isCurrentlyCompleted ? [...prev, lessonId] : prev.filter((id) => id !== lessonId)
      );
    } finally {
      setMarkingProgress(false);
    }
  };

  // Switch Lesson
  const handleSelectLesson = (lesson: CourseLesson) => {
    setActiveLessonId(lesson.id);
    setShowMobilePlaylist(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Next / Previous
  const handlePrevLesson = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonId(lessons[activeLessonIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextLesson = () => {
    if (activeLessonIndex < lessons.length - 1) {
      setActiveLessonId(lessons[activeLessonIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Trigger payment / enrollment modal
  const handleStartEnrollment = () => {
    if (!course) return;
    if (course.category === "free" || Number(course.price || 0) === 0) {
      // Free course auto-enroll
      if (!user?.id) {
        alert("يرجى تسجيل الدخول أو إنشاء حساب للانضمام فوراً ومجاناً.");
        return;
      }
      apiJson(`/courses/${course.id}/progress`, {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          lessonId: activeLesson?.id || "intro",
          completed: false,
        }),
      }).then(() => {
        window.location.reload();
      });
      return;
    }

    setPaymentItem({
      id: course.id,
      type: "course",
      title: course.titleAr,
      priceUsd: Number(course.price || 0),
      imageUrl: course.imageUrl,
    });
  };

  // Share URL
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAF7F2]"
      >
        <div className="w-14 h-14 rounded-2xl bg-[var(--sage)]/20 flex items-center justify-center mb-4 animate-bounce">
          <BookOpen className="w-7 h-7 text-[var(--sage-dark)]" />
        </div>
        <p className="text-base font-extrabold text-[var(--text-dark)] mb-1">
          جارٍ إعداد قاعة التعلّم التفاعلية...
        </p>
        <p className="text-xs text-[var(--text-muted)]">لحظات وتكونين داخل الدورة 🌿</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAF7F2] text-center"
      >
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-stone-200">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-stone-900 mb-2">تعذر فتح الدورة</h2>
          <p className="text-sm text-stone-600 mb-6">{error || "الدورة غير موجودة أو تم حذفها."}</p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--sage-dark)] text-white text-sm font-bold shadow-md hover:bg-[var(--text-dark)] transition-all"
          >
            <ArrowRight className="w-4 h-4" /> العودة لكافة الدورات
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentLessonCompleted = completedLessonIds.includes(activeLesson?.id || "");

  return (
    <div dir="rtl" className="min-h-screen bg-[#FBF9F5] text-[var(--text-dark)] flex flex-col">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. LMS TOP NAVIGATION BAR                                    */}
      {/* ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[rgba(127,169,155,0.2)] shadow-xs transition-all">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Right Section: Back to courses + Course Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href="/courses"
              className="w-10 h-10 rounded-2xl bg-[var(--cream)] hover:bg-[var(--sage)]/20 text-[var(--sage-dark)] flex items-center justify-center transition-all hover:scale-105 shrink-0 border border-[rgba(127,169,155,0.25)]"
              title="العودة إلى الدورات"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--cream)] text-[var(--sage-dark)] shrink-0 border border-[rgba(127,169,155,0.2)]">
                  {course.category === "workshop"
                    ? "ورشة تفاعلية"
                    : course.category === "free"
                    ? "دورة مجانية"
                    : "دورة مسجلة"}
                </span>
                <span className="hidden sm:inline text-xs text-[var(--text-muted)] truncate">
                  منصة رحلة سلام التعليمية
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black truncate max-w-[200px] sm:max-w-md md:max-w-xl text-[var(--text-dark)]">
                {course.titleAr}
              </h1>
            </div>
          </div>

          {/* Left Section: Progress Indicator + Mobile Playlist Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Progress Gauge (Desktop) */}
            <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-[var(--cream)]/70 border border-[rgba(127,169,155,0.2)]">
              <div className="text-right">
                <div className="text-[11px] font-bold text-[var(--sage-dark)]">
                  {progressPercentage}% مكتمل
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {completedLessonIds.length} من {lessons.length} دروس
                </div>
              </div>
              <div className="w-20 h-2 bg-white rounded-full overflow-hidden border border-stone-200">
                <div
                  className="h-full bg-gradient-to-r from-[var(--sage)] to-[var(--sage-dark)] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[rgba(127,169,155,0.25)] bg-white hover:bg-[var(--cream)] text-xs font-bold text-[var(--text-dark)] transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-[var(--sage-dark)]" />
              <span>{copiedLink ? "تم النسخ ✓" : "مشاركة"}</span>
            </button>

            {/* Course Details Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowDetailModal(true)}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--cream)] text-xs font-bold text-[var(--sage-dark)] hover:bg-[var(--sage)]/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>نبذة الدورة</span>
            </button>

            {/* Mobile Playlist Drawer Button */}
            <button
              type="button"
              onClick={() => setShowMobilePlaylist(true)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[var(--sage-dark)] text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all"
            >
              <Menu className="w-4 h-4" />
              <span>محتويات الدورة</span>
              <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                {lessons.length}
              </span>
            </button>
          </div>
        </div>

        {/* Thin progress bar line for mobile */}
        <div className="md:hidden h-1 w-full bg-stone-200">
          <div
            className="h-full bg-gradient-to-r from-[var(--sage)] to-[var(--sage-dark)] transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. MAIN LMS CLASSROOM STAGE (PLAYER + PLAYLIST SIDEBAR)      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 lg:px-8 py-5 sm:py-7 flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* LEFT / CENTER COLUMN: VIDEO PLAYER + LESSON DETAILS */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Modern 16:9 Cinema Container (Hardened with Anti-Inspect & Anti-Download) */}
          <div
            onContextMenu={(e) => {
              e.preventDefault();
              return false;
            }}
            onDragStart={(e) => {
              e.preventDefault();
              return false;
            }}
            className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-stone-800 flex items-center justify-center group select-none"
            style={{
              boxShadow: "0 20px 50px -10px rgba(26, 46, 42, 0.35)",
            }}
          >
            {isLessonUnlocked ? (
              /* UNLOCKED: VIDEO PLAYING */
              resolvedVideo.isEmbed && resolvedVideo.embedUrl ? (
                <iframe
                  key={resolvedVideo.embedUrl}
                  src={resolvedVideo.embedUrl}
                  title={activeLesson?.titleAr || course.titleAr}
                  className="w-full h-full border-0 select-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : signedVideoUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoElementRef}
                    key={signedVideoUrl}
                    src={signedVideoUrl}
                    controls
                    playsInline
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={(e) => {
                      e.preventDefault();
                      return false;
                    }}
                    className="w-full h-full object-contain bg-black select-none pointer-events-auto"
                  />
                  {/* Transparent Security Shield: intercepts inspect clicks & contextmenu */}
                  <div
                    className="absolute inset-x-0 top-0 bottom-16 z-10 cursor-pointer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      return false;
                    }}
                    onClick={() => {
                      const v = videoElementRef.current;
                      if (v) {
                        if (v.paused) v.play();
                        else v.pause();
                      }
                    }}
                  />
                </div>
              ) : loadingSignedUrl ? (
                <div className="flex flex-col items-center justify-center text-white/80 p-6 text-center">
                  <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin mb-3" />
                  <p className="text-xs font-semibold">جارٍ تجهيز بث الفيديو عالي الدقة...</p>
                </div>
              ) : (
                /* No video specified for this lesson */
                <div className="flex flex-col items-center justify-center text-center p-8 text-white">
                  <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3">
                    <Video className="w-8 h-8 text-[var(--sage)]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-1">
                    {activeLesson?.titleAr || "جلسة المحور التدريبي"}
                  </h3>
                  <p className="text-xs text-stone-300 max-w-sm mb-4 leading-relaxed">
                    محتوى هذا الدرس متوفر كشرح وتطبيقات عملية في الأسفل، أو يمكنكِ مشاهدة البث
                    المسجل عند اعتماده.
                  </p>
                </div>
              )
            ) : (
              /* LOCKED: HIGH CONVERTING GLASSMORPHIC LOCK SCREEN */
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#1A2E2A]/90 via-[#1A2E2A]/95 to-[#121F1C] backdrop-blur-md flex flex-col items-center justify-center text-center p-6 text-white z-20"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3 sm:mb-4 shadow-lg animate-pulse">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                  درس خاص بالمشتركات
                </span>

                <h3 className="text-lg sm:text-2xl font-black mb-2 text-white max-w-md leading-snug">
                  {activeLesson?.titleAr || "هذا الدرس مقفل"}
                </h3>

                <p className="text-xs sm:text-sm text-stone-300 max-w-md leading-relaxed mb-6">
                  اشتركي الآن في دورة <span className="text-white font-bold">«{course.titleAr}»</span>{" "}
                  للوصول المباشر لكافة الدروس والتطبيقات وملفات العمل، مع متابعة شخصية وشهادة إتمام.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={handleStartEnrollment}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>
                      {course.category === "free"
                        ? "الانضمام مجاناً للوصول"
                        : `اشتركي الآن (${course.price} $)`}
                    </span>
                  </button>

                  {/* If there's a free preview available, offer a shortcut */}
                  {lessons.some((l) => l.isFreePreview && l.id !== activeLesson?.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        const preview = lessons.find((l) => l.isFreePreview);
                        if (preview) setActiveLessonId(preview.id);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs text-stone-300 font-semibold transition-all"
                    >
                      مشاهدة الدرس التجريبي المجاني 🎁
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* LESSON TOOLBAR (UNDER VIDEO)                                  */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="mt-4 bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-[rgba(127,169,155,0.2)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[var(--sage-dark)] bg-[var(--cream)] px-2.5 py-0.5 rounded-full border border-[rgba(127,169,155,0.2)]">
                    الدرس {activeLessonIndex + 1} من {lessons.length}
                  </span>
                  {activeLesson?.duration && (
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {activeLesson.duration}
                    </span>
                  )}
                  {activeLesson?.isFreePreview && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      معاينة مجانية 🎁
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-[var(--text-dark)] leading-snug">
                  {activeLesson?.titleAr || "عنوان المحور"}
                </h2>
              </div>

              {/* Complete & Navigation Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {isEnrolled && (
                  <button
                    type="button"
                    disabled={markingProgress}
                    onClick={() => handleToggleComplete(activeLesson.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      isCurrentLessonCompleted
                        ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                        : "bg-[var(--cream)] text-[var(--sage-dark)] border border-[rgba(127,169,155,0.3)] hover:bg-[var(--sage)]/20"
                    }`}
                  >
                    {isCurrentLessonCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>أنجزتِ هذا الدرس ✓</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        <span>تحديد كمنجز</span>
                      </>
                    )}
                  </button>
                )}

                {/* Prev / Next buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activeLessonIndex === 0}
                    onClick={handlePrevLesson}
                    className="p-2.5 rounded-2xl border border-stone-200 hover:bg-stone-100 text-stone-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    title="الدرس السابق"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={activeLessonIndex === lessons.length - 1}
                    onClick={handleNextLesson}
                    className="p-2.5 rounded-2xl border border-stone-200 hover:bg-stone-100 text-stone-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    title="الدرس التالي"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-Tabs: Overview, Attachments, Support */}
            <div className="mt-4">
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "overview"
                      ? "bg-[var(--sage-dark)] text-white shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--cream)]"
                  }`}
                >
                  نظرة عامة وملاحظات
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("attachments")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "attachments"
                      ? "bg-[var(--sage-dark)] text-white shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--cream)]"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>المرفقات وملفات العمل</span>
                  {activeLesson?.attachmentUrl && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("support")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "support"
                      ? "bg-[var(--sage-dark)] text-white shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--cream)]"
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>استفسارات وتواصل</span>
                </button>
              </div>

              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div className="pt-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-[var(--cream)]/60 border border-[rgba(127,169,155,0.2)]">
                    <h4 className="text-xs font-bold text-[var(--sage-dark)] mb-2">
                      شرح وتوجيهات هذا الدرس:
                    </h4>
                    <p className="text-xs sm:text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-line">
                      {activeLesson?.descriptionAr ||
                        course.descAr ||
                        "استمتعي بمشاهدة هذا الدرس، ودوّني ملاحظاتكِ وتطبيقاتكِ اليومية لتحقيق أقصى استفادة عملية من محتوى الدورة."}
                    </p>
                  </div>

                  {course.featuresAr && course.featuresAr.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white border border-stone-200">
                      <h4 className="text-xs font-bold text-[var(--text-dark)] mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>محاور ترتبط بهذا المحتوى:</span>
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                        {course.featuresAr.map((f, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Attachments */}
              {activeTab === "attachments" && (
                <div className="pt-4">
                  {activeLesson?.attachmentUrl ? (
                    <div className="p-5 rounded-2xl bg-white border border-stone-200 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {activeLesson.attachmentName || "ملف عمل وتطبيقات الدرس.pdf"}
                          </h4>
                          <p className="text-xs text-stone-500">
                            مستند جاهز للطباعة والتحميل لمتابعة خطتك
                          </p>
                        </div>
                      </div>

                      <a
                        href={resolveMediaUrl(activeLesson.attachmentUrl)}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل الملف</span>
                      </a>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-[var(--cream)]/40 border border-dashed border-stone-300">
                      <FileText className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-stone-700">لا توجد ملفات مرفقة لهذا الدرس تحديداً</p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        كافة النقاط الرئيسية مشروحة بوضوح في الفيديو وتبويب الملاحظات.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Support */}
              {activeTab === "support" && (
                <div className="pt-4 space-y-3">
                  <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 mb-1">
                        لديكِ سؤال أو استفسار عن تطبيق هذا الدرس؟
                      </h4>
                      <p className="text-xs text-emerald-800 leading-relaxed max-w-lg">
                        يسعدنا مرافقتكِ في رحلتكِ! يمكنكِ مراسلة المرشدة وفريق سلام عبر الواتساب
                        مباشرة للإجابة على أي تساؤل تربوي أو استفسار تقني.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/201015473623?text=${encodeURIComponent(
                        `السلام عليكم، لدي استفسار بخصوص درس «${activeLesson?.titleAr}» في دورة «${course.titleAr}»`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm shrink-0 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>محادثة الواتساب الفورية</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* RIGHT / SIDEBAR COLUMN (DESKTOP): PLAYLIST CURRICULUM        */}
        {/* ──────────────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 shrink-0 bg-white rounded-3xl p-5 shadow-sm border border-[rgba(127,169,155,0.2)] h-[calc(100vh-6rem)] sticky top-20 overflow-hidden">
          {/* Sidebar Header */}
          <div className="pb-4 border-b border-stone-100 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-black text-base text-[var(--text-dark)] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--sage-dark)]" />
                <span>فهرس ومحاور الدورة</span>
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--cream)] text-[var(--sage-dark)]">
                {lessons.length} دروس
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {completedLessonIds.length} من {lessons.length} منجزة ({progressPercentage}%)
            </p>

            {/* Sidebar Progress Bar */}
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[var(--sage-dark)] rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Lessons Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-0.5 pl-1 scrollbar-thin">
            {lessons.map((lesson, idx) => {
              const isSelected = lesson.id === activeLessonId;
              const isDone = completedLessonIds.includes(lesson.id);
              const isLocked = !isEnrolled && !lesson.isFreePreview;

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => handleSelectLesson(lesson)}
                  className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-[var(--cream)] border-[var(--sage-dark)] shadow-xs scale-[1.01]"
                      : "bg-white border-stone-100 hover:border-stone-200 hover:bg-stone-50/70"
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : isLocked ? (
                      <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                        <Lock className="w-3 h-3" />
                      </div>
                    ) : isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[var(--sage-dark)] flex items-center justify-center text-white">
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center text-[10px] font-bold text-stone-500">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Lesson Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] text-[var(--text-muted)] font-bold">
                        درس {idx + 1}
                      </span>
                      {lesson.duration && (
                        <span className="text-[10px] text-stone-400">{lesson.duration}</span>
                      )}
                    </div>

                    <h4
                      className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 ${
                        isSelected ? "text-[var(--sage-dark)]" : "text-stone-800"
                      }`}
                    >
                      {lesson.titleAr}
                    </h4>

                    {lesson.isFreePreview && !isEnrolled && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        معاينة مجانية 🎁
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Certificate / Finish Banner if 100% completed */}
          {progressPercentage === 100 && (
            <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center shrink-0">
              <Award className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <h5 className="text-xs font-black text-emerald-900">مبارك إتمامكِ الدورة! 🌿</h5>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                أكملتِ كافة المحاور بنجاح. فخورون بكِ وبأثركِ المبارك في بيتكِ.
              </p>
            </div>
          )}

          {/* Quick Enroll Box if not enrolled */}
          {!isEnrolled && (
            <div className="mt-3 p-4 rounded-2xl bg-[var(--cream)] border border-[rgba(127,169,155,0.3)] shrink-0">
              <p className="text-xs font-bold text-[var(--text-dark)] mb-1">الوصول الكامل للدورة</p>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">
                احصلي على صلاحية الوصول مدى الحياة لجميع الفيديوهات والملفات.
              </p>
              <button
                type="button"
                onClick={handleStartEnrollment}
                className="w-full py-2.5 rounded-xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {course.category === "free" ? "ابدئي الآن مجاناً" : `اشتركي (${course.price} $)`}
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. MOBILE PLAYLIST DRAWER / BOTTOM SHEET                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showMobilePlaylist && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobilePlaylist(false)}
          />

          {/* Drawer Body */}
          <div className="relative bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
            {/* Handle & Header */}
            <div className="p-4 pb-3 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-[var(--text-dark)]">فهرس محاور الدورة</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {completedLessonIds.length} من {lessons.length} منجزة ({progressPercentage}%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobilePlaylist(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {lessons.map((lesson, idx) => {
                const isSelected = lesson.id === activeLessonId;
                const isDone = completedLessonIds.includes(lesson.id);
                const isLocked = !isEnrolled && !lesson.isFreePreview;

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => handleSelectLesson(lesson)}
                    className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-[var(--cream)] border-[var(--sage-dark)] shadow-xs"
                        : "bg-white border-stone-100 hover:bg-stone-50"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : isLocked ? (
                        <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                          <Lock className="w-3 h-3" />
                        </div>
                      ) : isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[var(--sage-dark)] flex items-center justify-center text-white">
                          <Play className="w-2.5 h-2.5 fill-current" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center text-[10px] font-bold text-stone-500">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] text-[var(--text-muted)] font-bold">
                          درس {idx + 1}
                        </span>
                        {lesson.duration && (
                          <span className="text-[10px] text-stone-400">{lesson.duration}</span>
                        )}
                      </div>
                      <h4
                        className={`text-xs font-bold leading-snug line-clamp-2 ${
                          isSelected ? "text-[var(--sage-dark)]" : "text-stone-800"
                        }`}
                      >
                        {lesson.titleAr}
                      </h4>
                      {lesson.isFreePreview && !isEnrolled && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          معاينة مجانية 🎁
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom CTA on mobile if not enrolled */}
            {!isEnrolled && (
              <div className="p-4 border-t border-stone-100 bg-[var(--cream)]/70">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobilePlaylist(false);
                    handleStartEnrollment();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[var(--sage-dark)] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>
                    {course.category === "free"
                      ? "الانضمام للدورة مجاناً"
                      : `اشتركي الآن (${course.price} $)`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. MODALS: PAYMENT & DETAILS                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {paymentItem && (
        <PaymentModal
          isOpen={Boolean(paymentItem)}
          onClose={() => setPaymentItem(null)}
          item={paymentItem}
        />
      )}

      {course && (
        <CourseDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          course={{
            id: course.id,
            title: tx(course.titleAr, course.titleEn || course.titleAr),
            desc: tx(course.descAr || "", course.descEn || course.descAr || ""),
            details: tx(course.detailsAr || course.descAr || "", course.descEn || ""),
            category: course.category,
            duration: tx(String(course.duration), String(course.duration)),
            students: "—",
            price: tx(
              course.category === "free" || Number(course.price || 0) === 0
                ? "مجاناً"
                : `${course.price} $`,
              course.category === "free" || Number(course.price || 0) === 0
                ? "Free"
                : `$${course.price}`
            ),
            rawPrice: Number(course.price || 0),
            free: course.category === "free" || Number(course.price || 0) === 0,
            imageUrl: course.imageUrl || null,
            images: course.images || [],
            gradient: course.gradient,
            videoUrl: course.videoUrl || null,
            features: course.featuresAr || [],
            badge: course.badgeAr ? tx(course.badgeAr, course.badgeAr) : null,
            lessons: course.lessons || [],
          }}
          onEnroll={() => {
            setShowDetailModal(false);
            handleStartEnrollment();
          }}
          isEnrolled={isEnrolled}
        />
      )}
    </div>
  );
}
