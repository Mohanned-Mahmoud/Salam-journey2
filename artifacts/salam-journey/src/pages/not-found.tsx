import { Link } from "wouter";
import { useLanguage, tx } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-5"
      style={{ background: "var(--cream)" }}
    >
      <div className="text-center max-w-md">
        <div
          className="text-7xl font-bold mb-4"
          style={{ color: "var(--sage-dark)", fontFamily: "var(--font-display)" }}
        >
          404
        </div>
        <h1 className="text-3xl mb-3">
          {t(tx("الصفحة غير موجودة", "Page not found"))}
        </h1>
        <p className="mb-8" style={{ color: "var(--text-body)" }}>
          {t(
            tx(
              "الصفحة التي تبحثين عنها غير متاحة. عودي إلى الرئيسية لاستكشاف ما نقدّمه.",
              "The page you're looking for isn't available. Head back home to explore.",
            ),
          )}
        </p>
        <Link href="/" className="pill-btn pill-btn-primary">
          {t(tx("العودة للرئيسية", "Back home"))}
        </Link>
      </div>
    </div>
  );
}
