import { useState, useEffect } from 'react';
import { Save, Clock, Globe, ExternalLink, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { DEFAULT_SETTINGS } from './types';
import type { AdminSettings } from './types';
import { apiJson } from '@/lib/api';

const TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// خريطة لربط أسماء الـ state بالمفاتيح (Keys) كـ Rows في قاعدة البيانات
const KEYS_MAP: Record<string, string> = {
  siteName: 'site_name',
  contactEmail: 'contact_email',
  whatsappNumber: 'whatsapp_number',
  instagramUrl: 'instagram_url',
  youtubeUrl: 'youtube_url',
  facebookUrl: 'facebook_url', 
  tiktokUrl: 'tiktok_url',     
  availableTimes: 'available_times',
  offDays: 'off_days',
  advanceDays: 'advance_days',
  confirmationMessage: 'confirmation_message',
};

interface ExtendedAdminSettings extends AdminSettings {
  facebookUrl?: string;
  tiktokUrl?: string;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<ExtendedAdminSettings>({
    ...DEFAULT_SETTINGS,
    facebookUrl: '',
    tiktokUrl: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<string>('full_website');
  const [modeSaving, setModeSaving] = useState(false);
  const [modeSuccess, setModeSuccess] = useState(false);

  // قراءة الإعدادات من قاعدة البيانات (كل مفتاح عبارة عن صف Row)
  useEffect(() => {
    async function fetchAllSettings() {
      try {
        apiJson<{ value: string }>('/site-settings/display_mode')
          .then((res) => {
            if (res?.value) setDisplayMode(res.value);
          })
          .catch(() => {});

        const promises = Object.entries(KEYS_MAP).map(async ([stateKey, dbKey]) => {
          try {
            const res = await apiJson<{ value: string }>(`/site-settings/${dbKey}`);
            return { stateKey, value: res.value };
          } catch {
            return { stateKey, value: null };
          }
        });

        const results = await Promise.all(promises);
        
        setSettings((prev) => {
          // حل مشكلة الـ TypeScript عن طريق تعريف الـ accumulator كـ Record مرن
          const updated: Record<string, any> = { ...prev };
          
          results.forEach(({ stateKey, value }) => {
            if (value !== null && value !== undefined && value !== "") {
              if (stateKey === 'availableTimes' || stateKey === 'offDays') {
                try {
                  updated[stateKey] = JSON.parse(value);
                } catch {
                  updated[stateKey] = value.split(',').filter(Boolean);
                }
              } else if (stateKey === 'advanceDays') {
                updated[stateKey] = Number(value) || prev.advanceDays;
              } else {
                updated[stateKey] = value;
              }
            }
          });
          return updated as ExtendedAdminSettings;
        });
      } catch (err) {
        console.error("Failed to load settings from DB:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllSettings();
  }, []);

  function set(key: keyof ExtendedAdminSettings, value: any) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTime(t: string) {
    const arr = settings.availableTimes.includes(t)
      ? settings.availableTimes.filter((x) => x !== t)
      : [...settings.availableTimes, t];
    set('availableTimes', arr);
  }

  function toggleDay(d: string) {
    const arr = settings.offDays.includes(d)
      ? settings.offDays.filter((x) => x !== d)
      : [...settings.offDays, d];
    set('offDays', arr);
  }

  async function handleDisplayModeChange(nextMode: string) {
    if (modeSaving || displayMode === nextMode) return;
    setModeSaving(true);
    const prevMode = displayMode;
    // Optimistic update
    setDisplayMode(nextMode);

    try {
      await apiJson('/admin/site-settings/display_mode', {
        method: 'PUT',
        body: JSON.stringify({ value: nextMode }),
      });
      setModeSuccess(true);
      setTimeout(() => setModeSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to update display mode:", err);
      // Revert if error
      setDisplayMode(prevMode);
      alert("تعذر حفظ وضع العرض: " + (err?.message || "يرجى التحقق من الاتصال بالخادم"));
    } finally {
      setModeSaving(false);
    }
  }

  // حفظ الإعدادات في قاعدة البيانات (تحديث أو إنشاء صف لكل Key)
  async function handleSave() {
    try {
      const promises = Object.entries(KEYS_MAP).map(([stateKey, dbKey]) => {
        let valueToSave = "";
        const rawValue = settings[stateKey as keyof ExtendedAdminSettings];

        if (Array.isArray(rawValue)) {
          valueToSave = JSON.stringify(rawValue);
        } else {
          valueToSave = String(rawValue ?? "");
        }

        return apiJson(`/admin/site-settings/${dbKey}`, {
          method: 'PUT',
          body: JSON.stringify({ value: valueToSave }),
        });
      });

      await Promise.all(promises);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save settings to DB:", err);
    }
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const inputStyle = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>جاري تحميل الإعدادات من قاعدة البيانات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>الإعدادات</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>إعدادات عامة للموقع</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: saved ? '#5A8A80' : 'var(--sage)' }}
        >
          <Save size={15} /> {saved ? 'تم الحفظ ✓' : 'حفظ'}
        </button>
      </div>

      {/* Website Display Mode Control (Coming Soon vs Live) */}
      <div
        className="rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all border"
        style={{
          background: displayMode === 'coming_soon'
            ? 'linear-gradient(135deg, #FFFDF8 0%, #FFF9EE 100%)'
            : 'white',
          borderColor: displayMode === 'coming_soon'
            ? 'rgba(217, 149, 45, 0.45)'
            : 'rgba(127, 169, 155, 0.2)',
          boxShadow: displayMode === 'coming_soon'
            ? '0 6px 24px rgba(217, 149, 45, 0.12)'
            : '0 2px 12px rgba(90, 138, 128, 0.08)',
        }}
      >
        {/* Header badge & title */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors"
              style={{
                background: displayMode === 'coming_soon' ? '#FEF3C7' : 'var(--sage-light)',
                color: displayMode === 'coming_soon' ? '#B45309' : 'var(--sage-dark)',
              }}
            >
              {displayMode === 'coming_soon' ? <Clock size={20} /> : <Globe size={20} />}
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg" style={{ color: 'var(--text-dark)' }}>
                وضع عرض الموقع (الرابط الرئيسي /)
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                تحكم في الصفحة التي تظهر للزوار عند فتح رابط الموقع
              </p>
            </div>
          </div>

          {/* Live Status Pill */}
          <div className="flex items-center gap-2">
            {displayMode === 'coming_soon' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                <span>صفحة قريباً نشطة حالياً</span>
              </span>
            ) : displayMode === 'funnel_page' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                <span>الصفحة التسويقية نشطة</span>
              </span>
            ) : displayMode === 'salam_journey' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span>مشروع سلام جيرني نشط</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>الموقع الكامل نشط</span>
              </span>
            )}

            {modeSuccess && (
              <span className="text-xs font-semibold text-emerald-700 animate-fade-in flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>تم الحفظ</span>
              </span>
            )}
          </div>
        </div>

        {/* Description / Explanatory Note */}
        <div
          className="p-3.5 rounded-2xl mb-5 text-xs leading-relaxed"
          style={{
            background: displayMode === 'coming_soon' ? 'rgba(254, 243, 199, 0.55)' : 'var(--cream)',
            color: 'var(--text-dark)',
            border: '1px solid rgba(127, 169, 155, 0.15)',
          }}
        >
          {displayMode === 'coming_soon' ? (
            <p>
              🌟 <strong>وضع قريباً مفعل:</strong> يرى جميع زوار الرابط الرئيسي صفحة <strong>Coming Soon</strong> الحصرية بتصميمها المتكامل مع نموذج التسجيل للتنبيه بالإطلاق والتواصل المباشر عبر واتساب. لوحة التحكم <code>/admin</code> وصفحات <code>/free-book/*</code> تظل متاحة لكِ دائماً.
            </p>
          ) : (
            <p>
              الموقع يعمل بشكل كامل لجميع الزوار. يمكنك التبديل إلى <strong>صفحة قريباً (Coming Soon)</strong> بضغطة زر واحدة أدناه في أي وقت عند تجهيز التحديثات أو قبل الإطلاق الرسمي.
            </p>
          )}
        </div>

        {/* Quick Action Toggle Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Coming Soon Button */}
          <button
            type="button"
            disabled={modeSaving}
            onClick={() => handleDisplayModeChange('coming_soon')}
            className={`p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-3.5 cursor-pointer ${
              displayMode === 'coming_soon'
                ? 'border-amber-500 bg-amber-50/80 shadow-sm'
                : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                displayMode === 'coming_soon' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Clock size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-sm text-gray-900">
                  صفحة قريباً (Coming Soon)
                </span>
                {displayMode === 'coming_soon' && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-200/90 px-2 py-0.5 rounded-full">
                    مفعّل الآن
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 leading-normal">
                تحويل الرابط الرئيسي (/) لصفحة تشويقية أنيقة لجمع المهتمين ورسائل الواتساب.
              </p>
            </div>
          </button>

          {/* Full Website Button */}
          <button
            type="button"
            disabled={modeSaving}
            onClick={() => handleDisplayModeChange('full_website')}
            className={`p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-3.5 cursor-pointer ${
              displayMode === 'full_website'
                ? 'border-[var(--sage-dark)] bg-emerald-50/70 shadow-sm'
                : 'border-gray-200 bg-white hover:border-[var(--sage)] hover:bg-emerald-50/30'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                displayMode === 'full_website' ? 'bg-[var(--sage-dark)] text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              <Globe size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-sm text-gray-900">
                  الموقع الكامل (Live Website)
                </span>
                {displayMode === 'full_website' && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/90 px-2 py-0.5 rounded-full">
                    مفعّل الآن
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 leading-normal">
                فتح وتفعيل كامل صفحات الموقع (الرئيسية، الدورات، الجلسات، المقالات، المتجر).
              </p>
            </div>
          </button>
        </div>

        {/* Other Modes & Live Preview */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(127,169,155,0.15)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-600">أوضاع أخرى:</span>
            <button
              type="button"
              disabled={modeSaving}
              onClick={() => handleDisplayModeChange('funnel_page')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                displayMode === 'funnel_page'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              الصفحة التسويقية
            </button>
            <button
              type="button"
              disabled={modeSaving}
              onClick={() => handleDisplayModeChange('salam_journey')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                displayMode === 'salam_journey'
                  ? 'bg-[var(--sage-dark)] text-white border-[var(--sage-dark)]'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              مشروع سلام جيرني
            </button>
            {modeSaving && <Loader2 size={14} className="animate-spin text-gray-500" />}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/test"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-emerald-800 hover:text-white hover:bg-emerald-700 transition-colors border border-emerald-300 bg-emerald-50 shadow-xs"
            >
              <Globe size={13} className="text-emerald-600" />
              <span>تجربة الموقع العادي (/test)</span>
              <ExternalLink size={13} />
            </a>

            <a
              href="/coming-soon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-[var(--sage-dark)] hover:text-white hover:bg-[var(--sage-dark)] transition-colors border border-[rgba(127,169,155,0.3)] bg-white shadow-xs"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>معاينة صفحة قريباً</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      <Card title="الإعدادات العامة للموقع والبراند">
        <div className="grid grid-cols-1 gap-4">
          <Field label="اسم الموقع / البراند" value={settings.siteName} onChange={(v) => set('siteName', v)} />
          <Field label="البريد الإلكتروني للاتصال" value={settings.contactEmail} onChange={(v) => set('contactEmail', v)} />
          <Field label="رقم الواتساب" value={settings.whatsappNumber} onChange={(v) => set('whatsappNumber', v)} />
          <Field label="رابط الإنستغرام" value={settings.instagramUrl ?? ''} onChange={(v) => set('instagramUrl', v)} />
          <Field label="رابط اليوتيوب" value={settings.youtubeUrl ?? ''} onChange={(v) => set('youtubeUrl', v)} />
          <Field label="رابط الفيسبوك" value={settings.facebookUrl ?? ''} onChange={(v) => set('facebookUrl', v)} />
          <Field label="رابط التيك توك" value={settings.tiktokUrl ?? ''} onChange={(v) => set('tiktokUrl', v)} />
        </div>
      </Card>

      <Card title="إعدادات الحجز">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-dark)' }}>أوقات Work المتاحة</p>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <button key={t} type="button" onClick={() => toggleTime(t)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: settings.availableTimes.includes(t) ? 'var(--sage)' : 'var(--cream)', color: settings.availableTimes.includes(t) ? 'white' : 'var(--text-body)', border: '1px solid rgba(127,169,155,0.2)' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-dark)' }}>أيام الإجازة</p>
            <div className="flex flex-wrap gap-2">
              {DAYS_AR.map((d) => (
                <button key={d} type="button" onClick={() => toggleDay(d)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: settings.offDays.includes(d) ? '#B5524A' : 'var(--cream)', color: settings.offDays.includes(d) ? 'white' : 'var(--text-body)', border: '1px solid rgba(127,169,155,0.2)' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>عدد الأيام المتاحة مسبقاً</label>
            <input type="number" min={1} max={90} value={settings.advanceDays} onChange={(e) => set('advanceDays', Number(e.target.value))} className={inputCls} style={{ ...inputStyle, maxWidth: 140 }} />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>رسالة التأكيد التلقائي</label>
            <textarea value={settings.confirmationMessage} onChange={(e) => set('confirmationMessage', e.target.value)} rows={3} className={inputCls} style={{ ...inputStyle, resize: 'none' }} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.15)', boxShadow: '0 2px 12px rgba(90,138,128,0.08)' }}>
      <h2 className="font-bold text-base mb-5" style={{ color: 'var(--text-dark)' }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>{label}</label>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }} />
    </div>
  );
}