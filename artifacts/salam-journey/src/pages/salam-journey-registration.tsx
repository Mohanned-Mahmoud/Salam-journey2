import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { useCreateLead } from '@workspace/api-client-react';
import { COUNTRY_CODES } from './country-codes.ts';
import './salam-journey-styles.css';

type FormData = { name: string; phone: string; email: string; whatsappCountryCode: string };
type Errors = Partial<Record<keyof FormData, string>>;
type Status = 'form' | 'watching_video' | 'booking';

function formatTimeLabel(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  const period = hours >= 12 ? 'م' : 'ص';
  const normalizedHours = hours % 12 || 12;
  return `${String(normalizedHours).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])}:${minutes.toString().padStart(2, '0').replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])} ${period}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.name.trim()) {
    errors.name = 'يرجى إدخال الاسم';
  }
  const phone = data.phone.replace(/[\s-]/g, '');
  if (!/^(?:\+?20|0)?1[0125]\d{8}$/.test(phone) && !/^\+?[1-9]\d{7,14}$/.test(phone)) {
    errors.phone = 'تحققي من رقم الهاتف (مثال: 010 1234 5678)';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) {
    errors.email = 'أدخلي بريدًا إلكترونيًا صحيحًا';
  }
  return errors;
}

function RegisterLogo() {
  return (
    <Link href="/salam-journey" data-testid="link-register-logo">
      <img src="/images/logo.png" alt="Salam Journey" className="h-10 w-auto object-contain" />
    </Link>
  );
}

export default function EbookRegistration() {
  const [data, setData] = useState<FormData>({ name: '', phone: '', email: '', whatsappCountryCode: '+20' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('form');
  const [serverError, setServerError] = useState('');
  const [leadId, setLeadId] = useState<string | null>(null);
  const createLead = useCreateLead();

  useEffect(() => {
    document.title = status === 'booking'
      ? 'احجزي استشارتك المجانية | Salam Journey'
      : 'احصلي على دليلك المجاني | Salam Journey';
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', 'سجّلي بياناتك واحجزي موعد استشارتك المجانية مع Salam Journey.');
  }, [status]);

  useEffect(() => {
    if (status !== 'watching_video') return;
    // Don't auto-transition anymore; transition is handled by video onEnded
  }, [status]);

  const handleVideoComplete = async () => {
    // Email is now handled by backend Brevo form submission
    setStatus('booking');
  };

  const update = (key: keyof FormData, value: string) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(data);
    setErrors(nextErrors);
    setServerError('');
    if (Object.keys(nextErrors).length === 0) {
      const fullPhone = `${data.whatsappCountryCode}${data.phone}`;
      createLead.mutate(
        { data: { name: data.name.trim(), phone: fullPhone, email: data.email.trim() } },
        {
          onSuccess: (lead) => {
            setLeadId(lead.id);
            setStatus('watching_video');
          },
          onError: (error) => {
            setServerError(getErrorMessage(error, 'تعذر حفظ بياناتك الآن. حاولي مرة أخرى.'));
          },
        },
      );
    }
  };

  return (
    <div className="sj-register-page sj-noise" dir="rtl">
      <div className={`sj-register-layout ${status === 'watching_video' || status === 'booking' ? 'video-mode' : ''}`}>
        <aside className="sj-register-aside">
          <RegisterLogo />
          <div className="sj-aside-copy">
            <div className="sj-kicker">رحلتك تبدأ من هنا</div>
            <h1>هدية صغيرة<br />لأيام كبيرة.</h1>
            <p>سنرسل لك الدليل مباشرة إلى بريدك الإلكتروني. خذي وقتك، واقرئيه على مهل… فهو لكِ.</p>
          </div>
          <div className="sj-aside-quote">«الأطفال لا يحتاجون إلى أم مثالية، بل إلى أم تشعر بهم وتحاول.»</div>
        </aside>

        <main className="sj-register-main">
          <div className="sj-form-wrap">
            <Link href="/salam-journey" className="sj-back" data-testid="link-back-home">
              <ArrowRight size={14} aria-hidden="true" /> العودة إلى صفحة الهدية
            </Link>
            
            {(status === 'watching_video' || status === 'booking') && (
              <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <RegisterLogo />
              </div>
            )}

            {status === 'form' && (
              <>
                <div className="sj-form-step">الخطوة ١ من ١ · أقل من دقيقة</div>
                <h2>أين نرسل لكِ الدليل؟</h2>
                <p className="sj-form-intro">أدخلي بياناتك لنجهّز نسختك المجانية. لا توجد قوائم مزعجة، وعد.</p>
                

                <form className="sj-fields" onSubmit={submit} noValidate>
                  <div className="sj-field">
                    <label htmlFor="sj-name">الاسم الكامل</label>
                    <input id="sj-name" className={`sj-input${errors.name ? ' invalid' : ''}`} value={data.name} onChange={(event) => update('name', event.target.value)} placeholder="مثال: منى أحمد" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'sj-name-error' : undefined} data-testid="input-name" />
                    {errors.name && <div className="sj-field-error" id="sj-name-error" role="alert" data-testid="error-name">{errors.name}</div>}
                  </div>
                  <div className="sj-field">
                    <label htmlFor="sj-phone">رقم واتس آب</label>
                    <div style={{ display: 'flex', gap: '8px', direction: 'ltr' }}>
                      <select 
                        className={`sj-input${errors.phone ? ' invalid' : ''}`}
                        style={{ width: '130px', padding: '14px 8px', flexShrink: 0 }}
                        value={data.whatsappCountryCode}
                        onChange={(event) => update('whatsappCountryCode', event.target.value)}
                        aria-label="كود الدولة"
                      >
                        {COUNTRY_CODES.map((code: { value: string; label: string }) => (
                          <option key={code.value} value={code.value}>{code.label}</option>
                        ))}
                      </select>
                      <input id="sj-phone" inputMode="tel" className={`sj-input${errors.phone ? ' invalid' : ''}`} value={data.phone} onChange={(event) => update('phone', event.target.value)} placeholder="10 1234 5678" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'sj-phone-error' : undefined} data-testid="input-phone" />
                    </div>
                    {errors.phone && <div className="sj-field-error" id="sj-phone-error" role="alert" data-testid="error-phone">{errors.phone}</div>}
                  </div>
                  <div className="sj-field">
                    <label htmlFor="sj-email">البريد الإلكتروني</label>
                    <input id="sj-email" type="email" dir="ltr" className={`sj-input${errors.email ? ' invalid' : ''}`} value={data.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'sj-email-error' : undefined} data-testid="input-email" />
                    {errors.email && <div className="sj-field-error" id="sj-email-error" role="alert" data-testid="error-email">{errors.email}</div>}
                  </div>
                  <button className="sj-cta sj-submit" type="submit" disabled={createLead.isPending} data-testid="button-submit-registration">
                    {createLead.isPending ? 'جارٍ تجهيز طلبك…' : 'أرسلوا لي الكتاب'} <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </form>
                {serverError && <div className="sj-field-error sj-server-error" role="alert">{serverError}</div>}
                <div className="sj-privacy"><LockKeyhole size={11} aria-hidden="true" /> بياناتك محفوظة معنا ولن نشاركها مع أي جهة.</div>
              </>
            )}

            {status === 'watching_video' && (
              <div className="sj-state" role="status" aria-live="polite" data-testid="status-video">
                <div className="sj-form-step">فيديو قصير لكِ · لحظات</div>
                <h2>نحضّر هديتك الآن…</h2>
                <p>استغلي وقت الانتظار في سماع الفيديو</p>
                <div style={{ margin: '20px 0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <video 
                    src="/VSL.mp4" 
                    controls 
                    autoPlay 
                    playsInline 
                    style={{ width: '100%', display: 'block' }}
                    onEnded={handleVideoComplete}
                  />
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px' }} className="sj-fade-in">
                  <button 
                    onClick={handleVideoComplete}
                    className="sj-cta"
                    type="button"
                  >
                    احجزي جلستك المجانية <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {status === 'booking' && (
              <div className="sj-booking" data-testid="status-booking">
                <div className="sj-form-step">الخطوة ٢ من ٢ · استشارة مجانية</div>
                <h2>خلّي لنا وقتًا<br />نسمعك فيه.</h2>
                <p className="sj-form-intro" style={{ marginBottom: '20px' }}>بعد مشاهدة الفيديو، احجزي موعدًا قصيرًا مع فريق Salam Journey لنتحدث عن احتياجاتك ونجيب عن أسئلتك.</p>
                <iframe 
                  frameBorder="0" 
                  width="100%" 
                  height="720" 
                  src="https://meet.brevo.com/eman-nasser/borderless"
                ></iframe>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
