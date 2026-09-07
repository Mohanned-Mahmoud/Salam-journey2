import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'wouter';
import './salam-journey-styles.css';

function Logo() {
  return (
    <Link href="/salam-journey" className="sj-logo" data-testid="link-logo">
      <span className="sj-logo-mark" aria-hidden="true">س</span>
      <span className="sj-logo-word">Salam Journey</span>
    </Link>
  );
}

export default function EbookLanding() {
  useEffect(() => {
    document.title = 'دليل صغير، أثر كبير | Salam Journey';
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', 'احصلي على دليل Salam Journey المجاني لتنشئة طفل واثق وسعيد، مكتوب بالعربية وبحب.');
  }, []);

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
            <Link href="/salam-journey/register" className="sj-cta" data-testid="link-get-ebook">
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

        <section className="sj-quote-band" aria-label="رسالة من الدليل">
          <div className="sj-quote-mark" aria-hidden="true">“</div>
          <blockquote>
            الطفل الواثق لا يولد من أم لا تخطئ، بل من أم تشعر به وتحاول أن تفهمه كل يوم.
            <cite>من صفحات الدليل</cite>
          </blockquote>
        </section>
      </main>

      <footer className="sj-container sj-footer">
        <strong>Salam Journey</strong>
        <span>نرافق العائلة في رحلتها، يومًا بيوم</span>
        <span className="sj-ltr">salamjourney.com</span>
      </footer>
    </div>
  );
}
