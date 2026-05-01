import { useState } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import { loadJson, saveJson, SETTINGS_KEY, DEFAULT_SETTINGS } from './types';
import type { AdminSettings } from './types';

const TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(() => loadJson<AdminSettings>(SETTINGS_KEY, DEFAULT_SETTINGS));
  const [saved, setSaved] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');

  function set<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
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

  function handleSave() {
    saveJson(SETTINGS_KEY, settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handlePasswordChange() {
    setPwdError('');
    if (pwdForm.current !== settings.adminPassword) { setPwdError('كلمة المرور الحالية غير صحيحة'); return; }
    if (!pwdForm.next || pwdForm.next.length < 6) { setPwdError('كلمة المرور الجديدة يجب أن تكون ٦ أحرف على الأقل'); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('كلمتا المرور غير متطابقتين'); return; }
    const updated = { ...settings, adminPassword: pwdForm.next };
    setSettings(updated);
    saveJson(SETTINGS_KEY, updated);
    setPwdForm({ current: '', next: '', confirm: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const inputStyle = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' };

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

      {/* General */}
      <Card title="الإعدادات العامة">
        <div className="grid grid-cols-1 gap-4">
          <Field label="اسم الموقع" value={settings.siteName} onChange={(v) => set('siteName', v)} />
          <Field label="البريد الإلكتروني" value={settings.contactEmail} onChange={(v) => set('contactEmail', v)} />
          <Field label="رقم الواتساب" value={settings.whatsappNumber} onChange={(v) => set('whatsappNumber', v)} />
          <Field label="رابط الإنستغرام" value={settings.instagramUrl} onChange={(v) => set('instagramUrl', v)} />
          <Field label="رابط اليوتيوب" value={settings.youtubeUrl} onChange={(v) => set('youtubeUrl', v)} />
        </div>
      </Card>

      {/* Booking */}
      <Card title="إعدادات الحجز">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-dark)' }}>أوقات العمل المتاحة</p>
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

      {/* Password change */}
      <Card title="تغيير كلمة مرور المسؤول">
        <div className="space-y-4">
          {pwdError && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(181,82,74,0.1)', color: '#B5524A' }}>{pwdError}</p>
          )}
          <PwdField label="كلمة المرور الحالية" value={pwdForm.current} onChange={(v) => setPwdForm({ ...pwdForm, current: v })} show={showPwd} onToggle={() => setShowPwd(!showPwd)} />
          <PwdField label="كلمة المرور الجديدة" value={pwdForm.next} onChange={(v) => setPwdForm({ ...pwdForm, next: v })} show={showPwd} onToggle={() => setShowPwd(!showPwd)} />
          <PwdField label="تأكيد كلمة المرور" value={pwdForm.confirm} onChange={(v) => setPwdForm({ ...pwdForm, confirm: v })} show={showPwd} onToggle={() => setShowPwd(!showPwd)} />
          <button type="button" onClick={handlePasswordChange} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--sage)' }}>تغيير كلمة المرور</button>
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
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }} />
    </div>
  );
}

function PwdField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl px-3 py-2.5 pe-10 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }} />
        <button type="button" onClick={onToggle} className="absolute top-1/2 -translate-y-1/2 end-3">
          {show ? <EyeOff size={15} style={{ color: 'var(--text-muted)' }} /> : <Eye size={15} style={{ color: 'var(--text-muted)' }} />}
        </button>
      </div>
    </div>
  );
}
