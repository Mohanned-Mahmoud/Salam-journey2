import { useEffect } from "react";
import { X, ExternalLink, ShieldCheck, ShoppingBag, Loader2 } from "lucide-react";

export interface StripeProductData {
  slug: string;
  aliases: string[];
  paymentLinkId: string;
  paymentLinkUrl: string;
  productId: string;
  priceId: string;
  name: string;
  description: string | null;
  images: string[];
  price: number;
  currency: string;
  active: boolean;
}

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: StripeProductData | null;
  loading?: boolean;
}

export function ProductPreviewModal({
  isOpen,
  onClose,
  product,
  loading = false,
}: ProductPreviewModalProps) {
  // Close on Escape key
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

  // Lock body scroll when modal is open
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

  if (!isOpen) return null;

  const handleBuyNow = () => {
    if (!product) return;

    // Trigger Meta Pixel InitiateCheckout tracking
    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "InitiateCheckout", {
          content_name: product.name,
          content_ids: [product.productId],
          content_type: "product",
          value: product.price,
          currency: product.currency,
        });
      }
    } catch (err) {
      console.warn("Meta Pixel InitiateCheckout error:", err);
    }

    // Redirect to existing Stripe payment link
    window.location.href = product.paymentLinkUrl;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden z-10 max-h-[92vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Border */}
        <div className="h-1.5 bg-gradient-to-r from-[var(--sage)] via-[var(--sage-dark)] to-[var(--blush)] shrink-0" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق النافذة"
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 text-[var(--text-dark)] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sage-dark)]"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !product ? (
          <div className="py-20 px-6 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--sage-dark)] mb-4" />
            <p className="text-sm font-medium text-[var(--text-body)]">
              جاري جلب تفاصيل المنتج مباشرة من Stripe...
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto p-6 sm:p-8 flex-1">
            {/* Product Cover Image from Stripe */}
            {product.images && product.images.length > 0 ? (
              <div className="relative mb-6 rounded-2xl overflow-hidden bg-[var(--cream)] border border-[var(--border)] max-h-64 flex items-center justify-center">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain max-h-64"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[var(--cream-dark)] text-[var(--sage-dark)] flex items-center justify-center mx-auto mb-5 border border-[var(--border)]">
                <ShoppingBag className="w-10 h-10" />
              </div>
            )}

            {/* Product Title */}
            <h2
              id="preview-modal-title"
              className="text-2xl sm:text-3xl font-extrabold text-[var(--text-dark)] text-center mb-3 leading-tight"
            >
              {product.name}
            </h2>

            {/* Price Badge */}
            <div className="flex justify-center items-center mb-5">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-lg sm:text-xl font-bold">
                <span>${product.price.toFixed(2)}</span>
                <span className="text-sm font-medium">{product.currency}</span>
              </span>
            </div>

            {/* Product Description (Strictly from Stripe without fabrication) */}
            {product.description ? (
              <div className="bg-[var(--cream)]/60 rounded-2xl p-4 sm:p-5 border border-[var(--border)] mb-6 text-sm text-[var(--text-body)] leading-relaxed">
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            ) : null}

            {/* Security Guarantee Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#718079] mb-6 bg-[var(--cream)]/50 py-2.5 px-4 rounded-xl border border-[var(--border)]">
              <ShieldCheck className="w-4 h-4 text-[var(--sage-dark)] shrink-0" />
              <span>معاملة دفع مشفرة ومؤمنة بالكامل بواسطة Stripe</span>
            </div>

            {/* Buy Now Action Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBuyNow}
                className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white font-bold text-base transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                <span>شراء الآن (${product.price.toFixed(2)} {product.currency})</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs text-[var(--text-body)] hover:bg-[var(--cream)] transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

