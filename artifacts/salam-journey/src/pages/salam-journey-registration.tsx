import { ArrowRight, CalendarDays, Check, Clock3, LockKeyhole } from 'lucide-react';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import { Link } from 'wouter';
import {
  useCreateConsultation,
  useCreateLead,
  useListConsultationSlots,
} from '@workspace/api-client-react';
import { COUNTRY_CODES } from './country-codes.ts';
import './salam-journey-styles.css';

type FormData = { name: string; phone: string; email: string; whatsappCountryCode: string };
type Errors = Partial<Record<keyof FormData, string>>;
type Status = 'form' | 'watching_video' | 'booking' | 'success';
type Appointment = { day: string; time: string };

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
  const [appointment, setAppointment] = useState<Appointment>({ day: '', time: '' });
  const [bookingError, setBookingError] = useState('');
  const [serverError, setServerError] = useState('');
  const [leadId, setLeadId] = useState<string | null>(null);
  const brevoFormRef = useRef<HTMLFormElement>(null);
  const createLead = useCreateLead();
  const slotsQuery = useListConsultationSlots({
    query: { enabled: status === 'booking' } as any,
  });
  const createConsultation = useCreateConsultation();

  useEffect(() => {
    document.title = status === 'success'
      ? 'موعدك تأكد | Salam Journey'
      : status === 'booking'
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
    // Email is now handled by Brevo form submission
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
            if (brevoFormRef.current) {
              brevoFormRef.current.submit();
            }
            setStatus('watching_video');
          },
          onError: (error) => {
            setServerError(getErrorMessage(error, 'تعذر حفظ بياناتك الآن. حاولي مرة أخرى.'));
          },
        },
      );
    }
  };

  const selectAppointment = (key: keyof Appointment, value: string) => {
    setAppointment((current) => ({ ...current, [key]: value }));
    setBookingError('');
  };

  const confirmAppointment = () => {
    if (!appointment.day || !appointment.time) {
      setBookingError('اختاري اليوم والساعة المناسبة لكِ أولاً');
      return;
    }
    if (!leadId) {
      setBookingError('انتهت جلسة التسجيل. أعيدي إدخال بياناتك من فضلك.');
      return;
    }

    setBookingError('');
    setServerError('');
    createConsultation.mutate(
      {
        data: {
          leadId,
          scheduledDate: appointment.day,
          scheduledTime: appointment.time,
        },
      },
      {
        onSuccess: () => setStatus('success'),
        onError: (error) => {
          setServerError(getErrorMessage(error, 'تعذر تأكيد الموعد. اختاري وقتًا آخر.'));
          void slotsQuery.refetch();
        },
      },
    );
  };

  const resetFlow = () => {
    setStatus('form');
    setErrors({});
    setAppointment({ day: '', time: '' });
    setBookingError('');
    setServerError('');
    setLeadId(null);
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
                
                <iframe name="brevo_frame" id="brevo_frame" style={{ display: 'none' }} title="hidden-iframe"></iframe>
                <form
                  ref={brevoFormRef}
                  style={{ display: 'none' }}
                  method="POST"
                  target="brevo_frame"
                  action="https://ea6200ad.sibforms.com/serve/MUIFAAsuq79YYyfyx7hoTn8ECq4qxA5i4R8w-OV1BiWlce5ZAtfW1DlvFB5dEbVMK-imqq5AndbpDZnChJ4vT5iW8RK6tu7Bd6sDxfhusklhvLhU-5mvSN1XSNxAmPjBRW_4xNIoCecKHKhzggQEgVCvoP_xQlRyEYJWKptOhluQRaUYidgTs9x36V1AhipaalHp2wZuMK3XJIpsiw=="
                >
                  <input type="hidden" name="FIRSTNAME" value={data.name} />
                  <input type="hidden" name="EMAIL" value={data.email} />
                  <input type="hidden" name="WHATSAPP__COUNTRY_CODE" value={data.whatsappCountryCode} />
                  <input type="hidden" name="WHATSAPP" value={data.phone} />
                  <input type="hidden" name="email_address_check" value="" />
                  <input type="hidden" name="locale" value="en" />
                </form>

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
                <p className="sj-form-intro">بعد مشاهدة الفيديو، احجزي موعدًا قصيرًا مع فريق Salam Journey لنتحدث عن احتياجاتك ونجيب عن أسئلتك.</p>

                {slotsQuery.isLoading && <div className="sj-slot-loading" role="status">نجهّز المواعيد المتاحة…</div>}
                {slotsQuery.isError && <div className="sj-field-error sj-server-error" role="alert">تعذر تحميل المواعيد الآن. حدّثي الصفحة وحاولي مرة أخرى.</div>}
                {!slotsQuery.isLoading && !slotsQuery.isError && (
                  <>
                    <div className="sj-booking-group">
                      <div className="sj-booking-label"><CalendarDays size={15} aria-hidden="true" /> اختاري اليوم</div>
                      <div className="sj-day-grid" role="group" aria-label="اختيار يوم الاستشارة">
                        {slotsQuery.data?.map((day) => {
                          const [weekday, ...dateParts] = day.label.split('،');
                          return (
                            <button
                              className={`sj-day-option${appointment.day === day.date ? ' selected' : ''}`}
                              key={day.date}
                              type="button"
                              onClick={() => selectAppointment('day', day.date)}
                              aria-pressed={appointment.day === day.date}
                              disabled={day.times.length === 0}
                            >
                              <span>{weekday}</span>
                              <strong>{dateParts.join('،')}</strong>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sj-booking-group">
                      <div className="sj-booking-label"><Clock3 size={15} aria-hidden="true" /> اختاري الوقت</div>
                      <div className="sj-time-grid" role="group" aria-label="اختيار وقت الاستشارة">
                        {(slotsQuery.data?.find((day) => day.date === appointment.day)?.times ?? []).map((time) => (
                          <button
                            className={`sj-time-option${appointment.time === time ? ' selected' : ''}`}
                            key={time}
                            type="button"
                            onClick={() => selectAppointment('time', time)}
                            aria-pressed={appointment.time === time}
                          >
                            {formatTimeLabel(time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {bookingError && <div className="sj-field-error sj-booking-error" role="alert">{bookingError}</div>}
                {serverError && <div className="sj-field-error sj-server-error" role="alert">{serverError}</div>}
                <button className="sj-cta sj-submit" type="button" onClick={confirmAppointment} disabled={createConsultation.isPending || slotsQuery.isLoading || slotsQuery.isError} data-testid="button-confirm-appointment">
                  {createConsultation.isPending ? 'جارٍ تأكيد الموعد…' : 'تأكيد موعد الاستشارة'} <ArrowRight size={17} aria-hidden="true" />
                </button>
                <div className="sj-privacy"><LockKeyhole size={11} aria-hidden="true" /> الموعد مجاني ومدته ٢٠ دقيقة.</div>
              </div>
            )}

            {status === 'success' && (
              <div className="sj-state" data-testid="status-success">
                <div className="sj-success-mark" aria-hidden="true"><Check size={32} /></div>
                <h2>تم حجز موعدك بنجاح.</h2>
                <p>سيرسل لكِ الدليل على <strong dir="ltr" data-testid="text-destination-email">{data.email}</strong>،<br />وسننتظرك يوم {slotsQuery.data?.find((day) => day.date === appointment.day)?.label} الساعة {formatTimeLabel(appointment.time)} للاستشارة المجانية.</p>
                <button className="sj-small-link" type="button" onClick={resetFlow} data-testid="button-register-another">
                  حجز موعد آخر
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
