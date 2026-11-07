import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import './salam-journey-styles.css';

import { FaWhatsapp, FaInstagram, FaYoutube, FaFacebook, FaTiktok } from "react-icons/fa";
import { apiJson } from "@/lib/api";
import { Footer } from '@/components/layout/footer';
import About from '@/pages/about';
import { ProductPreviewModal, type StripeProductData } from "@/components/product-preview-modal";

function Logo() {
  return (
    <Link href="/free-book" data-testid="link-logo">
      <img src="/images/logo.png" alt="Salam Journey" className="h-10 w-auto object-contain" />
    </Link>
  );
}

export default function EbookLanding() {
  const [social, setSocial] = useState({ whatsapp: "", instagram: "", youtube: "", facebook: "", tiktok: "" });
  const [stripeProducts, setStripeProducts] = useState<StripeProductData[]>([]);
  const [previewModalProduct, setPreviewModalProduct] = useState<StripeProductData | null>(null);

  useEffect(() => {
    document.title = 'دليل صغير، أثر كبير | Salam Journey';
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', 'احصلي على دليل Salam Journey المجاني لتنشئة طفل واثق وسعيد، مكتوب بالعربية وبحب.');

    // Fetch dynamic products from Stripe backend
    apiJson<{ products: StripeProductData[] }>('/stripe/products-preview')
      .then((res) => {
        if (res && res.products) {
          setStripeProducts(res.products);
        }
      })
      .catch((err) => console.warn('Could not load Stripe products preview:', err));

    // Inject Meta Pixel Code specifically for this page
    const scriptId = 'meta-pixel-landing';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '2147923472435483');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.id = scriptId + '-ns';
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=2147923472435483&ev=PageView&noscript=1" />`;
      document.head.appendChild(noscript);
    }

    Promise.all([
      apiJson<{value: string}>('/site-settings/whatsapp_number').catch(()=>({value:""})),
      apiJson<{value: string}>('/site-settings/instagram_url').catch(()=>({value:""})),
      apiJson<{value: string}>('/site-settings/youtube_url').catch(()=>({value:""})),
      apiJson<{value: string}>('/site-settings/facebook_url').catch(()=>({value:""})),
      apiJson<{value: string}>('/site-settings/tiktok_url').catch(()=>({value:""}))
    ]).then(([wa, ig, yt, fb, tk]) => {
      const cleanWa = wa.value.replace(/\D/g, "");
      setSocial({
        whatsapp: cleanWa ? `https://wa.me/${cleanWa}` : "",
        instagram: ig.value,
        youtube: yt.value,
        facebook: fb.value,
        tiktok: tk.value
      });
    });
  }, []);

  const socialLinks = [
    { href: social.whatsapp, Icon: FaWhatsapp, show: !!social.whatsapp },
    { href: social.instagram, Icon: FaInstagram, show: !!social.instagram },
    { href: social.youtube, Icon: FaYoutube, show: !!social.youtube },
    { href: social.facebook, Icon: FaFacebook, show: !!social.facebook },
    { href: social.tiktok, Icon: FaTiktok, show: !!social.tiktok },
  ];

  return (
    <div className="sj-page sj-noise" dir="rtl">
      <header className="sj-header sj-container">
        <Logo />
        <div className="sj-header-meta">
          <span className="sj-header-note">دليل صغير، أثر كبير</span>
          <span className="sj-ltr">salamjourney.com</span>
        </div>
      </header>

      <main>
        <section className="sj-container sj-hero">
          <div>
            <div className="sj-kicker">هدية مجانية من Salam Journey</div>
            <h1>
              خطوات بسيطة<br />
              لتنشئة <em>طفل واثق وسعيد</em>
            </h1>
            <p className="sj-lede">
              دليل عملي من 18 صفحة، صُمّم للأمهات والآباء الذين يريدون تربية أطفالهم بالحب والوعي… خطوة صغيرة كل يوم.
            </p>
            <Link href="/free-book/register" className="sj-cta" data-testid="link-get-ebook">
              احصلي على نسختك المجانية
              <ArrowLeft size={17} aria-hidden="true" />
            </Link>
            <div className="sj-note">
              <LockKeyhole size={12} aria-hidden="true" /> لن نرسل لك إلا ما يفيدك، ويمكنك إلغاء الاشتراك في أي وقت
            </div>
          </div>

          <div className="sj-art-wrap">
            <div className="sj-art-card">
              <img src="/images/ebook-blank.jpeg" alt="غلاف كتاب خطوات لتنشئة طفل واثق وسعيد" data-testid="img-ebook-cover" />
              <div className="sj-art-stamp"><strong>18</strong>صفحة<br />من القلب</div>
              <div className="sj-art-caption">دليل هادئ للأيام المليئة بالأسئلة</div>
            </div>
          </div>
        </section>

        <div className="sj-container sj-trust" data-testid="group-trust-points">
          <div className="sj-trust-item"><b>01</b><span>أداة عملية وليست محاضرة</span></div>
          <div className="sj-trust-item"><b>02</b><span>مكتوب بالعربية وبحب</span></div>
          <div className="sj-trust-item"><b>03</b><span>يصل إلى بريدك فوراً</span></div>
        </div>

        <section className="sj-container sj-content-section">
          <div className="sj-content-heading">
            <div className="sj-eyebrow">ماذا ستجدين داخله؟</div>
            <h2>لأن التربية لا تحتاج إلى أم مثالية، بل إلى أم حاضرة.</h2>
          </div>
          <div className="sj-benefits">
            <article className="sj-benefit" data-testid="card-benefit-language">
              <span className="sj-benefit-number">01</span>
              <h3>لغة تقرّبكم من بعض</h3>
              <p>عبارات يومية تساعدك على فهم مشاعر طفلك والرد عليها بهدوء وثقة.</p>
            </article>
            <article className="sj-benefit" data-testid="card-benefit-steps">
              <span className="sj-benefit-number">02</span>
              <h3>خطوات قابلة للتطبيق</h3>
              <p>أفكار بسيطة يمكنك تجربتها الليلة، بدون ضغط أو تعقيد.</p>
            </article>
            <article className="sj-benefit" data-testid="card-benefit-space">
              <span className="sj-benefit-number">03</span>
              <h3>مساحة لكِ أيضاً</h3>
              <p>تذكير لطيف بأن راحتك جزء من طفولة سعيدة.</p>
            </article>
          </div>
        </section>

        {stripeProducts.length > 0 && (
          <section className="sj-container" style={{ margin: '60px auto 40px' }} data-testid="section-stripe-products">
            <div className="sj-content-heading" style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div className="sj-eyebrow">برامج وإصدارات سلام</div>
              <h2>خطوات داعمة لرحلتكِ الأسرية</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {stripeProducts.map((prod) => (
                <div
                  key={prod.productId}
                  className="bg-white rounded-3xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-right"
                >
                  <div>
                    {prod.images && prod.images.length > 0 && (
                      <div className="rounded-2xl overflow-hidden bg-[var(--cream)] mb-4 max-h-52 flex items-center justify-center border border-[var(--border)]">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-contain max-h-52"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[var(--text-dark)]">{prod.name}</h3>
                      <span className="shrink-0 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold">
                        ${prod.price.toFixed(2)} {prod.currency}
                      </span>
                    </div>
                    {prod.description && (
                      <p className="text-xs text-[var(--text-body)] line-clamp-3 mb-4 leading-relaxed whitespace-pre-line">
                        {prod.description}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 mt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setPreviewModalProduct(prod)}
                      className="w-full py-3 px-5 rounded-xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <span>معاينة التفاصيل والطلب</span>
                      <ArrowLeft size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="sj-quote-band" aria-label="رسالة من الدليل">
          <div className="sj-quote-mark" aria-hidden="true">“</div>
          <blockquote>
            الطفل الواثق لا يولد من أم لا تخطئ، بل من أم تشعر به وتحاول أن تفهمه كل يوم.
            <cite>من صفحات الدليل</cite>
          </blockquote>
        </section>
      </main>

      <div className="sj-about-wrapper" style={{ marginTop: '50px' }}>
        <About hideBookingButton={true} />
      </div>

      <footer className="sj-simple-footer" style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid var(--sj-line)' }}>
        <div className="sj-social-links" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
          {socialLinks.filter(l => l.show).map((l, i) => (
            <a key={i} href={l.href} target="_blank" rel="noreferrer" style={{ color: 'var(--sj-terra)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(169, 82, 58, 0.08)', transition: 'all 0.2s' }}>
              <l.Icon size={22} />
            </a>
          ))}
        </div>
        <p style={{ color: '#829089', fontSize: '12px', margin: 0 }}>© {new Date().getFullYear()} أكاديمية سلام | جميع الحقوق محفوظة</p>
      </footer>

      {/* Dynamic Stripe Product Preview Modal */}
      <ProductPreviewModal
        isOpen={Boolean(previewModalProduct)}
        onClose={() => setPreviewModalProduct(null)}
        product={previewModalProduct}
      />
    </div>
  );
}
