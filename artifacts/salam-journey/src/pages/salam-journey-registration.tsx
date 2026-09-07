import { ArrowRight, CalendarDays, Check, Clock3, LockKeyhole, Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import {
  useCreateConsultation,
  useCreateLead,
  useListConsultationSlots,
} from '@workspace/api-client-react';
import { useReveal } from '@/lib/use-reveal';
import { SoftBlob } from '@/components/section-divider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FormData = { name: string; phone: string; email: string };
type Errors = Partial<Record<keyof FormData, string>>;
type Status = 'form' | 'preparing' | 'booking' | 'success';
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
  if (!data.name.trim() || data.name.trim().split(/\s+/).length < 2 || !/[\u0600-\u06ff]/.test(data.name)) {
    errors.name = 'اكتبي الاسم الكامل باللغة العربية';
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

export default function EbookRegistration() {
  const ref = useReveal<HTMLDivElement>();
  const [data, setData] = useState<FormData>({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('form');
  const [appointment, setAppointment] = useState<Appointment>({ day: '', time: '' });
  const [bookingError, setBookingError] = useState('');
  const [serverError, setServerError] = useState('');
  const [leadId, setLeadId] = useState<number | null>(null);

  const createLead = useCreateLead();
  const slotsQuery = useListConsultationSlots({
    query: { enabled: status === 'booking' },
  });
  const createConsultation = useCreateConsultation();

  useEffect(() => {
    document.title = status === 'success'
      ? 'موعدك تأكد | Salam Journey'
      : status === 'booking'
        ? 'احجزي استشارتك المجانية | Salam Journey'
        : 'احصلي على دليلك المجاني | Salam Journey';
  }, [status]);

  useEffect(() => {
    if (status !== 'preparing') return;
    const timer = window.setTimeout(() => setStatus('booking'), 1600);
    return () => window.clearTimeout(timer);
  }, [status]);

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
      createLead.mutate(
        { data: { name: data.name.trim(), phone: data.phone, email: data.email.trim() } },
        {
          onSuccess: (lead) => {
            setLeadId(lead.id);
            setStatus('preparing');
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
    <div ref={ref} className="relative min-h-[85vh] bg-[var(--cream)] overflow-hidden flex items-center py-16">
      <SoftBlob
        color="var(--blush)"
        className="absolute -top-32 -start-32 w-[600px] h-[600px] opacity-40 animate-drift pointer-events-none"
      />
      
      <div className="container mx-auto px-5 md:px-8 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 lg:gap-24">
          {/* Sidebar / Context */}
          <div className="w-full md:w-5/12 flex flex-col justify-center reveal">
            <span className="uppercase tracking-[0.18em] text-xs font-semibold mb-3 text-[var(--sage-dark)]">
              رحلتك تبدأ من هنا
            </span>
            <h1 className="text-4xl md:text-5xl leading-tight mb-6 text-[var(--text-dark)]">
              هدية صغيرة<br />لأيام كبيرة.
            </h1>
            <p className="text-lg text-[var(--text-body)] mb-8">
              سنرسل لك الدليل مباشرة إلى بريدك الإلكتروني. خذي وقتك، واقرئيه على مهل… فهو لكِ.
            </p>
            <div className="p-6 rounded-2xl bg-[var(--sage-muted)]/30 border border-[var(--sage-light)] text-[var(--text-dark)] italic text-lg leading-relaxed">
              «الأطفال لا يحتاجون إلى أم مثالية، بل إلى أم تشعر بهم وتحاول.»
            </div>
          </div>

          {/* Form Area */}
          <div className="w-full md:w-7/12 reveal" data-reveal-delay="120">
            <div className="glass-card p-8 md:p-12 shadow-xl border border-white/50 bg-white/70 backdrop-blur-xl relative overflow-hidden rounded-[2rem]">
              
              <Link href="/salam-journey" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors mb-8 text-sm">
                <ArrowRight size={14} /> العودة إلى صفحة الهدية
              </Link>

              {status === 'form' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-[var(--sage-dark)] text-sm font-semibold mb-2">الخطوة ١ من ١ · أقل من دقيقة</div>
                  <h2 className="text-2xl md:text-3xl mb-4 text-[var(--text-dark)]">أين نرسل لكِ الدليل؟</h2>
                  <p className="text-[var(--text-body)] mb-8">أدخلي بياناتك لنجهّز نسختك المجانية. لا توجد قوائم مزعجة، وعد.</p>
                  
                  <form onSubmit={submit} noValidate className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="sj-name" className="text-sm font-medium text-[var(--text-dark)]">الاسم الكامل</label>
                      <Input 
                        id="sj-name" 
                        value={data.name} 
                        onChange={(e) => update('name', e.target.value)} 
                        placeholder="مثال: منى أحمد" 
                        className={`bg-white ${errors.name ? 'border-red-500 ring-red-500' : ''}`}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="sj-phone" className="text-sm font-medium text-[var(--text-dark)]">رقم الهاتف</label>
                      <Input 
                        id="sj-phone" 
                        inputMode="tel"
                        value={data.phone} 
                        onChange={(e) => update('phone', e.target.value)} 
                        placeholder="010 1234 5678" 
                        className={`bg-white ${errors.phone ? 'border-red-500 ring-red-500' : ''}`}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="sj-email" className="text-sm font-medium text-[var(--text-dark)]">البريد الإلكتروني</label>
                      <Input 
                        id="sj-email" 
                        type="email"
                        dir="ltr"
                        value={data.email} 
                        onChange={(e) => update('email', e.target.value)} 
                        placeholder="you@example.com" 
                        className={`bg-white text-left ${errors.email ? 'border-red-500 ring-red-500' : ''}`}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1 text-right">{errors.email}</p>}
                    </div>

                    <Button 
                      type="submit" 
                      disabled={createLead.isPending} 
                      className="w-full h-12 mt-4 rounded-xl text-md font-semibold text-white bg-[var(--sage-dark)] hover:bg-[var(--sage)] transition-colors gap-2"
                    >
                      {createLead.isPending ? <Loader2 className="animate-spin" size={18} /> : 'أرسلوا لي الكتاب'}
                      {!createLead.isPending && <ArrowRight size={17} />}
                    </Button>
                  </form>
                  
                  {serverError && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{serverError}</div>}
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                    <LockKeyhole size={12} /> بياناتك محفوظة معنا ولن نشاركها مع أي جهة.
                  </div>
                </div>
              )}

              {status === 'preparing' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-12">
                  <div className="w-16 h-16 rounded-full border-4 border-[var(--sage-light)] border-t-[var(--sage-dark)] animate-spin mx-auto mb-8" />
                  <div className="text-[var(--sage-dark)] text-sm font-semibold mb-2">فيديو قصير لكِ · لحظات</div>
                  <h2 className="text-2xl md:text-3xl mb-4 text-[var(--text-dark)]">نحضّر هديتك الآن…</h2>
                  <p className="text-[var(--text-body)]">شاهدي الفيديو القصير، وبعده اختاري موعد الاستشارة المجانية.</p>
                </div>
              )}

              {status === 'booking' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-[var(--sage-dark)] text-sm font-semibold mb-2">الخطوة ٢ من ٢ · استشارة مجانية</div>
                  <h2 className="text-2xl md:text-3xl mb-4 text-[var(--text-dark)]">خلّي لنا وقتًا نسمعك فيه.</h2>
                  <p className="text-[var(--text-body)] mb-8">بعد مشاهدة الفيديو، احجزي موعدًا قصيرًا مع فريق Salam Journey لنتحدث عن احتياجاتك ونجيب عن أسئلتك.</p>

                  {slotsQuery.isLoading && (
                    <div className="py-12 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin" size={24} />
                      نجهّز المواعيد المتاحة…
                    </div>
                  )}
                  {slotsQuery.isError && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                      تعذر تحميل المواعيد الآن. حدّثي الصفحة وحاولي مرة أخرى.
                    </div>
                  )}
                  {!slotsQuery.isLoading && !slotsQuery.isError && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 font-medium text-[var(--text-dark)]"><CalendarDays size={16} /> اختاري اليوم</div>
                        <div className="grid grid-cols-2 gap-2">
                          {slotsQuery.data?.map((day) => {
                            const [weekday, ...dateParts] = day.label.split('،');
                            return (
                              <button
                                key={day.date}
                                type="button"
                                onClick={() => selectAppointment('day', day.date)}
                                disabled={day.times.length === 0}
                                className={`p-3 rounded-xl border text-sm transition-all flex flex-col items-center justify-center gap-1
                                  ${appointment.day === day.date 
                                    ? 'border-[var(--sage-dark)] bg-[var(--sage-light)]/20 text-[var(--sage-dark)] font-bold shadow-sm' 
                                    : 'border-gray-200 bg-white hover:border-[var(--sage)] hover:bg-gray-50 text-[var(--text-dark)]'}
                                  ${day.times.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
                                `}
                              >
                                <span>{weekday}</span>
                                <strong className="font-semibold">{dateParts.join('،')}</strong>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 font-medium text-[var(--text-dark)]"><Clock3 size={16} /> اختاري الوقت</div>
                        <div className="grid grid-cols-3 gap-2">
                          {(slotsQuery.data?.find((day) => day.date === appointment.day)?.times ?? []).map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => selectAppointment('time', time)}
                              className={`p-3 rounded-xl border text-sm transition-all flex items-center justify-center
                                ${appointment.time === time 
                                  ? 'border-[var(--sage-dark)] bg-[var(--sage-dark)] text-white font-bold shadow-sm' 
                                  : 'border-gray-200 bg-white hover:border-[var(--sage)] hover:bg-gray-50 text-[var(--text-dark)]'}
                              `}
                            >
                              {formatTimeLabel(time)}
                            </button>
                          ))}
                          {appointment.day && (slotsQuery.data?.find((day) => day.date === appointment.day)?.times.length === 0) && (
                            <div className="col-span-3 text-center text-sm text-[var(--text-muted)] py-4">
                              لا توجد مواعيد متاحة في هذا اليوم.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {bookingError && <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{bookingError}</div>}
                  {serverError && <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{serverError}</div>}
                  
                  <Button 
                    type="button" 
                    onClick={confirmAppointment} 
                    disabled={createConsultation.isPending || slotsQuery.isLoading || slotsQuery.isError}
                    className="w-full h-12 mt-8 rounded-xl text-md font-semibold text-white bg-[var(--sage-dark)] hover:bg-[var(--sage)] transition-colors gap-2"
                  >
                    {createConsultation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'تأكيد موعد الاستشارة'}
                    {!createConsultation.isPending && <ArrowRight size={17} />}
                  </Button>
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                    <LockKeyhole size={12} /> الموعد مجاني ومدته ٢٠ دقيقة.
                  </div>
                </div>
              )}

              {status === 'success' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-[var(--sage-light)] text-[var(--sage-dark)] flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Check size={40} />
                  </div>
                  <h2 className="text-2xl md:text-3xl mb-4 text-[var(--text-dark)]">تم حجز موعدك بنجاح.</h2>
                  <p className="text-[var(--text-body)] mb-8 leading-relaxed">
                    سيرسل لكِ الدليل على <strong dir="ltr" className="text-[var(--text-dark)] mx-1">{data.email}</strong>،<br />
                    وسننتظرك يوم {slotsQuery.data?.find((day) => day.date === appointment.day)?.label} الساعة {formatTimeLabel(appointment.time)} للاستشارة المجانية.
                  </p>
                  
                  <a 
                    href="/images/ebook-blank.jpeg" 
                    download="salam-journey-guide.jpeg" 
                    className="flex items-center justify-center gap-2 w-full h-12 mb-4 rounded-xl text-md font-semibold text-white bg-[var(--sage-dark)] hover:bg-[var(--sage)] transition-colors"
                  >
                    تحميل الدليل الآن <ArrowRight size={17} />
                  </a>
                  
                  <button onClick={resetFlow} className="text-sm font-medium text-[var(--sage-dark)] hover:underline underline-offset-4">
                    حجز موعد آخر
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
