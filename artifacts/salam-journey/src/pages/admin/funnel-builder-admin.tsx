import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save, Eye, EyeOff, Plus, Trash2, Copy, ChevronUp, ChevronDown,
  Loader2, Monitor, Smartphone, ToggleLeft, ToggleRight, GripVertical,
  Star, Zap, Users, Clock, Image, Video, MessageSquare, HelpCircle,
  Award, List, BarChart2, User, Mic2, AlignCenter, Layout
} from 'lucide-react';
import { apiJson } from '@/lib/api';
import type { FunnelBlock, FunnelBlockType } from './types';

// ─── Block Library Definition ─────────────────────────────────────────────────

const BLOCK_LIBRARY: { type: FunnelBlockType; label: string; desc: string; Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }> }[] = [
  { type: 'hero',         label: 'هيرو / رأس الصفحة', desc: 'عنوان رئيسي مع زر CTA وخلفية ملونة', Icon: Layout },
  { type: 'headline',     label: 'عنوان + وصف',        desc: 'نص رئيسي وفقرة وصفية',              Icon: AlignCenter },
  { type: 'countdown',    label: 'عداد تنازلي',         desc: 'مؤقت ينتهي في تاريخ محدد',          Icon: Clock },
  { type: 'stats',        label: 'إحصائيات وأرقام',     desc: 'مربعات بأرقام مؤثرة',               Icon: BarChart2 },
  { type: 'qualifier',    label: 'هذا البرنامج لكِ',    desc: 'قائمة مؤشرات تأهل الزائر',          Icon: List },
  { type: 'bio',          label: 'بطاقة المدرّب',        desc: 'صورة واسم ونبذة عن الكوتش',         Icon: User },
  { type: 'speakers',     label: 'متحدثون / خبراء',     desc: 'شبكة صور وأسماء الضيوف',            Icon: Mic2 },
  { type: 'curriculum',   label: 'المنهج / الجدول',     desc: 'جدول يومي أو خطوات تفصيلية',        Icon: List },
  { type: 'testimonials', label: 'آراء وتجارب',          desc: 'بطاقات شهادات المشتركين',           Icon: MessageSquare },
  { type: 'image',        label: 'صورة',                 desc: 'صورة مع عنوان وتعليق اختياري',      Icon: Image },
  { type: 'video',        label: 'فيديو',                desc: 'فيديو مضمّن من يوتيوب أو رابط',     Icon: Video },
  { type: 'cta',          label: 'زر دعوة للتسجيل',     desc: 'بانر بزر CTA ونص تحفيزي',           Icon: Zap },
  { type: 'bonus',        label: 'بونص / هدايا',         desc: 'قائمة المكافآت والهدايا',           Icon: Star },
  { type: 'faq',          label: 'أسئلة شائعة',          desc: 'أكورديون بالأسئلة والأجوبة',        Icon: HelpCircle },
  { type: 'guarantee',    label: 'ضمان الجودة',          desc: 'شارة الضمان والثقة',                Icon: Award },
];

const BLOCK_DEFAULTS: Record<FunnelBlockType, Record<string, any>> = {
  hero:         { headline: 'عنوانك الرئيسي هنا', subheadline: 'وصف مختصر ومقنع للبرنامج', ctaText: 'سجّلي الآن', ctaLink: '#', bgColor: '#7FA99B' },
  headline:     { headline: 'عنوان جذاب', subheadline: 'فقرة توضيحية تشرح الفكرة أو المرحلة', textAlign: 'center' },
  countdown:    { title: 'ينتهي العرض خلال', targetDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16), subtitle: 'لا تفوّتي الفرصة' },
  stats:        { items: [{ number: '+2000', label: 'مشتركة' }, { number: '98%', label: 'معدل الرضا' }, { number: '+50', label: 'جلسة' }] },
  qualifier:    { title: 'هذا البرنامج مناسب لكِ إذا...', items: ['البند الأول', 'البند الثاني', 'البند الثالث'] },
  bio:          { name: 'اسم المدرّب', title: 'اختصاصية في...', bio: 'نبذة تعريفية عن الكوتش وخبرتها.', imageUrl: '' },
  speakers:     { title: 'ضيوفنا من الخبراء', items: [{ name: 'اسم الضيف', title: 'اختصاصه', imageUrl: '' }] },
  curriculum:   { title: 'ماذا ستتعلمين؟', items: [{ day: 'اليوم ١', title: 'عنوان الجلسة', desc: 'ما ستتعلمينه' }] },
  testimonials: { title: 'ماذا قالت الأمهات؟', items: [{ name: 'الاسم', role: 'أم', quote: 'رأي إيجابي عن البرنامج.' }] },
  image:        { imageUrl: '', alt: 'صورة', caption: '' },
  video:        { videoUrl: '', title: 'عنوان الفيديو', caption: '' },
  cta:          { headline: 'جاهزة للانضمام؟', subheadline: 'انضمي إلى آلاف الأمهات', buttonText: 'احجزي مقعدك الآن', buttonLink: '#', bgColor: '#7FA99B' },
  bonus:        { title: 'ما ستحصلين عليه', items: [{ title: 'الهدية الأولى', desc: 'وصفها' }] },
  faq:          { title: 'أسئلة شائعة', items: [{ question: 'السؤال الأول؟', answer: 'الإجابة هنا.' }] },
  guarantee:    { title: 'ضمان استرداد كامل', text: 'إذا لم تكوني راضية خلال ٣٠ يوماً نسترد لكِ المبلغ كاملاً دون أي أسئلة.', icon: '🛡️' },
};

function genId() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Block Label Mapper ────────────────────────────────────────────────────────

function blockLabel(type: FunnelBlockType): string {
  return BLOCK_LIBRARY.find((b) => b.type === type)?.label ?? type;
}

// ─── Block Editor ──────────────────────────────────────────────────────────────

function StringField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "w-full rounded-xl px-3 py-2 text-sm outline-none";
  const style = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.3)', color: 'var(--text-dark)' };
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {multiline
        ? <textarea className={cls} style={{ ...style, minHeight: 80, resize: 'vertical' }} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={cls} style={style} value={value} onChange={(e) => onChange(e.target.value)} />
      }
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#7FA99B'} onChange={(e) => onChange(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-none" />
        <input className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.3)', color: 'var(--text-dark)' }} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <select className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.3)', color: 'var(--text-dark)' }} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function StringListField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <div className="space-y-1.5">
        {value.map((item, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              className="flex-1 rounded-xl px-3 py-1.5 text-sm outline-none"
              style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.3)', color: 'var(--text-dark)' }}
              value={item}
              onChange={(e) => { const n = [...value]; n[i] = e.target.value; onChange(n); }}
            />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-2 rounded-lg" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...value, ''])} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: 'var(--sage)', color: 'white' }}>
          <Plus size={12} /> إضافة
        </button>
      </div>
    </div>
  );
}

function ObjectListField({
  label, value, onChange, fields
}: {
  label: string;
  value: Record<string, string>[];
  onChange: (v: Record<string, string>[]) => void;
  fields: { key: string; label: string; multiline?: boolean }[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <div className="space-y-3">
        {value.map((item, i) => (
          <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.2)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 rounded-lg" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                <Trash2 size={11} />
              </button>
            </div>
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                {f.multiline
                  ? <textarea className="w-full rounded-lg px-2 py-1.5 text-xs outline-none" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)', resize: 'vertical', minHeight: 56 }} value={item[f.key] ?? ''} onChange={(e) => { const n = [...value]; n[i] = { ...n[i], [f.key]: e.target.value }; onChange(n); }} />
                  : <input className="w-full rounded-lg px-2 py-1.5 text-xs outline-none" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }} value={item[f.key] ?? ''} onChange={(e) => { const n = [...value]; n[i] = { ...n[i], [f.key]: e.target.value }; onChange(n); }} />
                }
              </div>
            ))}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const empty: Record<string, string> = {};
            fields.forEach((f) => { empty[f.key] = ''; });
            onChange([...value, empty]);
          }}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-medium"
          style={{ background: 'var(--sage)', color: 'white' }}
        >
          <Plus size={12} /> إضافة
        </button>
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: FunnelBlock; onChange: (data: Record<string, any>) => void }) {
  const d = block.data;
  function set(key: string, val: any) { onChange({ ...d, [key]: val }); }

  const inpCls = "w-full rounded-xl px-3 py-2 text-sm outline-none";
  const inpStyle = { background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.3)', color: 'var(--text-dark)' };

  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <StringField label="العنوان الرئيسي" value={d.headline ?? ''} onChange={(v) => set('headline', v)} multiline />
          <StringField label="العنوان الفرعي" value={d.subheadline ?? ''} onChange={(v) => set('subheadline', v)} multiline />
          <StringField label="نص الزر" value={d.ctaText ?? ''} onChange={(v) => set('ctaText', v)} />
          <StringField label="رابط الزر" value={d.ctaLink ?? ''} onChange={(v) => set('ctaLink', v)} />
          <ColorField label="لون الخلفية" value={d.bgColor ?? '#7FA99B'} onChange={(v) => set('bgColor', v)} />
        </div>
      );
    case 'headline':
      return (
        <div className="space-y-3">
          <StringField label="العنوان" value={d.headline ?? ''} onChange={(v) => set('headline', v)} />
          <StringField label="الوصف" value={d.subheadline ?? ''} onChange={(v) => set('subheadline', v)} multiline />
          <SelectField label="محاذاة النص" value={d.textAlign ?? 'center'} onChange={(v) => set('textAlign', v)} options={[{ label: 'وسط', value: 'center' }, { label: 'يمين', value: 'right' }, { label: 'يسار', value: 'left' }]} />
        </div>
      );
    case 'countdown':
      return (
        <div className="space-y-3">
          <StringField label="العنوان" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>تاريخ الانتهاء</label>
            <input type="datetime-local" className={inpCls} style={inpStyle} value={d.targetDate ?? ''} onChange={(e) => set('targetDate', e.target.value)} />
          </div>
          <StringField label="نص تحت العداد" value={d.subtitle ?? ''} onChange={(v) => set('subtitle', v)} />
        </div>
      );
    case 'stats':
      return (
        <ObjectListField
          label="الإحصائيات"
          value={d.items ?? []}
          onChange={(v) => set('items', v)}
          fields={[{ key: 'number', label: 'الرقم (+2000)' }, { key: 'label', label: 'التسمية' }]}
        />
      );
    case 'qualifier':
      return (
        <div className="space-y-3">
          <StringField label="العنوان" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <StringListField label="البنود" value={d.items ?? []} onChange={(v) => set('items', v)} />
        </div>
      );
    case 'bio':
      return (
        <div className="space-y-3">
          <StringField label="الاسم" value={d.name ?? ''} onChange={(v) => set('name', v)} />
          <StringField label="اللقب / المسمى" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <StringField label="النبذة" value={d.bio ?? ''} onChange={(v) => set('bio', v)} multiline />
          <StringField label="رابط الصورة" value={d.imageUrl ?? ''} onChange={(v) => set('imageUrl', v)} />
        </div>
      );
    case 'speakers':
      return (
        <div className="space-y-3">
          <StringField label="عنوان القسم" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <ObjectListField
            label="الضيوف"
            value={d.items ?? []}
            onChange={(v) => set('items', v)}
            fields={[{ key: 'name', label: 'الاسم' }, { key: 'title', label: 'التخصص' }, { key: 'imageUrl', label: 'رابط الصورة' }]}
          />
        </div>
      );
    case 'curriculum':
      return (
        <div className="space-y-3">
          <StringField label="عنوان القسم" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <ObjectListField
            label="الجلسات"
            value={d.items ?? []}
            onChange={(v) => set('items', v)}
            fields={[{ key: 'day', label: 'اليوم / الجلسة' }, { key: 'title', label: 'عنوانها' }, { key: 'desc', label: 'الوصف', multiline: true }]}
          />
        </div>
      );
    case 'testimonials':
      return (
        <div className="space-y-3">
          <StringField label="عنوان القسم" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <ObjectListField
            label="الشهادات"
            value={d.items ?? []}
            onChange={(v) => set('items', v)}
            fields={[{ key: 'name', label: 'الاسم' }, { key: 'role', label: 'الدور' }, { key: 'quote', label: 'الشهادة', multiline: true }]}
          />
        </div>
      );
    case 'image':
      return (
        <div className="space-y-3">
          <StringField label="رابط الصورة" value={d.imageUrl ?? ''} onChange={(v) => set('imageUrl', v)} />
          <StringField label="النص البديل" value={d.alt ?? ''} onChange={(v) => set('alt', v)} />
          <StringField label="التعليق (اختياري)" value={d.caption ?? ''} onChange={(v) => set('caption', v)} />
        </div>
      );
    case 'video':
      return (
        <div className="space-y-3">
          <StringField label="رابط الفيديو (يوتيوب أو mp4)" value={d.videoUrl ?? ''} onChange={(v) => set('videoUrl', v)} />
          <StringField label="عنوان الفيديو" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <StringField label="التعليق (اختياري)" value={d.caption ?? ''} onChange={(v) => set('caption', v)} />
        </div>
      );
    case 'cta':
      return (
        <div className="space-y-3">
          <StringField label="العنوان" value={d.headline ?? ''} onChange={(v) => set('headline', v)} />
          <StringField label="النص الفرعي" value={d.subheadline ?? ''} onChange={(v) => set('subheadline', v)} />
          <StringField label="نص الزر" value={d.buttonText ?? ''} onChange={(v) => set('buttonText', v)} />
          <StringField label="رابط الزر" value={d.buttonLink ?? ''} onChange={(v) => set('buttonLink', v)} />
          <ColorField label="لون الخلفية" value={d.bgColor ?? '#7FA99B'} onChange={(v) => set('bgColor', v)} />
        </div>
      );
    case 'bonus':
      return (
        <div className="space-y-3">
          <StringField label="عنوان القسم" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <ObjectListField
            label="المكافآت"
            value={d.items ?? []}
            onChange={(v) => set('items', v)}
            fields={[{ key: 'title', label: 'عنوان المكافأة' }, { key: 'desc', label: 'وصفها', multiline: true }]}
          />
        </div>
      );
    case 'faq':
      return (
        <div className="space-y-3">
          <StringField label="عنوان القسم" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <ObjectListField
            label="الأسئلة"
            value={d.items ?? []}
            onChange={(v) => set('items', v)}
            fields={[{ key: 'question', label: 'السؤال' }, { key: 'answer', label: 'الإجابة', multiline: true }]}
          />
        </div>
      );
    case 'guarantee':
      return (
        <div className="space-y-3">
          <StringField label="الأيقونة (إيموجي)" value={d.icon ?? '🛡️'} onChange={(v) => set('icon', v)} />
          <StringField label="العنوان" value={d.title ?? ''} onChange={(v) => set('title', v)} />
          <StringField label="النص" value={d.text ?? ''} onChange={(v) => set('text', v)} multiline />
        </div>
      );
    default:
      return <p className="text-xs" style={{ color: 'var(--text-muted)' }}>لا يوجد إعدادات لهذا البلوك.</p>;
  }
}

// ─── Countdown Timer Hook ──────────────────────────────────────────────────────

function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTime({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

// ─── Block Preview Renderers (mini inline preview in canvas) ───────────────────

function BlockPreview({ block }: { block: FunnelBlock }) {
  const d = block.data;
  const CountdownInner = ({ t }: { t: string }) => {
    const time = useCountdown(t);
    return (
      <div className="flex gap-3 justify-center">
        {[{ v: time.d, l: 'يوم' }, { v: time.h, l: 'ساعة' }, { v: time.m, l: 'دقيقة' }, { v: time.s, l: 'ثانية' }].map((u) => (
          <div key={u.l} className="text-center">
            <div className="text-xl font-bold w-12 h-12 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>{u.v}</div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{u.l}</div>
          </div>
        ))}
      </div>
    );
  };

  switch (block.type) {
    case 'hero':
      return (
        <div className="rounded-xl px-6 py-8 text-center" style={{ background: d.bgColor || '#7FA99B' }}>
          <h2 className="text-lg font-bold text-white mb-2">{d.headline || 'العنوان الرئيسي'}</h2>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>{d.subheadline}</p>
          <span className="inline-block px-5 py-2 rounded-full font-semibold text-sm" style={{ background: 'white', color: d.bgColor || '#7FA99B' }}>{d.ctaText || 'سجّلي الآن'}</span>
        </div>
      );
    case 'headline':
      return (
        <div className="py-4 px-6" style={{ textAlign: (d.textAlign as any) || 'center' }}>
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-dark)' }}>{d.headline}</h3>
          <p className="text-sm" style={{ color: 'var(--text-body)' }}>{d.subheadline}</p>
        </div>
      );
    case 'countdown':
      return (
        <div className="rounded-xl px-6 py-5 text-center" style={{ background: '#2D4A44' }}>
          <p className="text-sm font-semibold mb-3 text-white">{d.title}</p>
          <CountdownInner t={d.targetDate || new Date(Date.now() + 86400000).toISOString()} />
          {d.subtitle && <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>{d.subtitle}</p>}
        </div>
      );
    case 'stats':
      return (
        <div className="flex flex-wrap gap-3 justify-center py-4 px-2">
          {(d.items ?? []).map((item: any, i: number) => (
            <div key={i} className="text-center px-4 py-3 rounded-xl" style={{ background: 'var(--sage-muted)', minWidth: 80 }}>
              <div className="text-lg font-bold" style={{ color: 'var(--sage-dark)' }}>{item.number}</div>
              <div className="text-xs" style={{ color: 'var(--text-body)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      );
    case 'qualifier':
      return (
        <div className="py-4 px-6">
          <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-dark)' }}>{d.title}</p>
          <ul className="space-y-1">
            {(d.items ?? []).slice(0, 3).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-body)' }}>
                <span style={{ color: 'var(--sage)' }}>✓</span> {item}
              </li>
            ))}
            {(d.items ?? []).length > 3 && <li className="text-xs" style={{ color: 'var(--text-muted)' }}>+{(d.items ?? []).length - 3} بنود أخرى</li>}
          </ul>
        </div>
      );
    case 'bio':
      return (
        <div className="flex items-center gap-4 py-4 px-6">
          <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-xl" style={{ background: 'var(--sage)' }}>
            {d.imageUrl ? <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover rounded-2xl" /> : (d.name?.[0] ?? '؟')}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>{d.name}</p>
            <p className="text-xs" style={{ color: 'var(--sage)' }}>{d.title}</p>
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-body)' }}>{d.bio}</p>
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="py-4 px-6">
          <p className="font-semibold text-sm mb-3" style={{ color: 'var(--text-dark)' }}>{d.title}</p>
          <div className="flex gap-2 overflow-hidden">
            {(d.items ?? []).slice(0, 2).map((t: any, i: number) => (
              <div key={i} className="flex-1 rounded-xl p-3 min-w-0" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.2)' }}>
                <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-body)' }}>"{t.quote}"</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-dark)' }}>{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'cta':
      return (
        <div className="rounded-xl px-6 py-6 text-center" style={{ background: d.bgColor || '#7FA99B' }}>
          <p className="font-bold text-white mb-1">{d.headline}</p>
          {d.subheadline && <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.85)' }}>{d.subheadline}</p>}
          <span className="inline-block px-5 py-2 rounded-full font-semibold text-sm" style={{ background: 'white', color: d.bgColor || '#7FA99B' }}>{d.buttonText}</span>
        </div>
      );
    case 'faq':
      return (
        <div className="py-4 px-6">
          <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-dark)' }}>{d.title}</p>
          {(d.items ?? []).slice(0, 2).map((item: any, i: number) => (
            <div key={i} className="text-xs py-1.5 border-b" style={{ borderColor: 'rgba(127,169,155,0.15)', color: 'var(--text-body)' }}>
              <span className="font-medium" style={{ color: 'var(--text-dark)' }}>{item.question}</span>
            </div>
          ))}
        </div>
      );
    case 'guarantee':
      return (
        <div className="text-center py-4 px-6">
          <div className="text-3xl mb-1">{d.icon || '🛡️'}</div>
          <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-dark)' }}>{d.title}</p>
          <p className="text-xs" style={{ color: 'var(--text-body)' }}>{d.text}</p>
        </div>
      );
    case 'bonus':
      return (
        <div className="py-4 px-6">
          <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-dark)' }}>{d.title}</p>
          {(d.items ?? []).slice(0, 2).map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs mb-1" style={{ color: 'var(--text-body)' }}>
              <span style={{ color: '#F59E0B' }}>★</span> <span><strong>{item.title}</strong> — {item.desc}</span>
            </div>
          ))}
        </div>
      );
    case 'image':
      return (
        <div className="py-4 px-6 text-center">
          {d.imageUrl
            ? <img src={d.imageUrl} alt={d.alt} className="w-full max-h-32 object-cover rounded-xl" />
            : <div className="w-full h-20 rounded-xl flex items-center justify-center" style={{ background: 'var(--cream)', border: '1px dashed rgba(127,169,155,0.4)' }}><Image size={24} style={{ color: 'var(--sage)' }} /></div>
          }
          {d.caption && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{d.caption}</p>}
        </div>
      );
    case 'video':
      return (
        <div className="py-4 px-6 text-center">
          <div className="w-full h-20 rounded-xl flex items-center justify-center gap-2" style={{ background: '#1a1a1a' }}>
            <Video size={20} style={{ color: 'white' }} />
            <span className="text-xs text-white">{d.title || 'فيديو'}</span>
          </div>
        </div>
      );
    case 'speakers':
      return (
        <div className="py-4 px-6">
          <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-dark)' }}>{d.title}</p>
          <div className="flex gap-2">
            {(d.items ?? []).slice(0, 3).map((s: any, i: number) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-sm text-white" style={{ background: 'var(--sage)' }}>
                  {s.imageUrl ? <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover rounded-full" /> : (s.name?.[0] ?? '؟')}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dark)' }}>{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'curriculum':
      return (
        <div className="py-4 px-6">
          <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-dark)' }}>{d.title}</p>
          {(d.items ?? []).slice(0, 2).map((item: any, i: number) => (
            <div key={i} className="flex gap-2 text-xs mb-1">
              <span className="font-semibold shrink-0" style={{ color: 'var(--sage)' }}>{item.day}</span>
              <span style={{ color: 'var(--text-body)' }}>{item.title}</span>
            </div>
          ))}
        </div>
      );
    default:
      return <div className="py-3 px-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>{blockLabel(block.type)}</div>;
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AdminFunnelBuilder() {
  const [blocks, setBlocks] = useState<FunnelBlock[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [displayMode, setDisplayMode] = useState<'full_website' | 'funnel_page'>('full_website');
  const [togglingMode, setTogglingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dragSrc = useRef<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiJson<{ blocks: FunnelBlock[] }>('/funnel-page'),
      apiJson<{ value: string }>('/site-settings/display_mode'),
    ]).then(([page, setting]) => {
      setBlocks(Array.isArray(page.blocks) ? page.blocks : []);
      setDisplayMode((setting.value === 'funnel_page' ? 'funnel_page' : 'full_website') as any);
    }).catch(() => {
      setError('تعذّر تحميل بيانات الصفحة. تحقق من الاتصال.');
    }).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await apiJson('/admin/funnel-page', { method: 'PUT', body: JSON.stringify({ blocks }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('فشل الحفظ. حاولي مجدداً.');
    } finally {
      setSaving(false);
    }
  }, [blocks]);

  const toggleDisplayMode = useCallback(async () => {
    const next = displayMode === 'full_website' ? 'funnel_page' : 'full_website';
    setTogglingMode(true);
    try {
      await apiJson('/admin/site-settings/display_mode', { method: 'PUT', body: JSON.stringify({ value: next }) });
      setDisplayMode(next);
    } catch {
      setError('فشل تغيير وضع العرض.');
    } finally {
      setTogglingMode(false);
    }
  }, [displayMode]);

  function addBlock(type: FunnelBlockType) {
    const newBlock: FunnelBlock = { id: genId(), type, data: { ...BLOCK_DEFAULTS[type] } };
    setBlocks((prev) => [...prev, newBlock]);
    setSelected(newBlock.id);
  }

  function updateBlock(id: string, data: Record<string, any>) {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, data } : b));
  }

  function deleteBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selected === id) setSelected(null);
  }

  function duplicateBlock(id: string) {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const dup: FunnelBlock = { ...blocks[idx], id: genId(), data: { ...blocks[idx].data } };
    const next = [...blocks];
    next.splice(idx + 1, 0, dup);
    setBlocks(next);
    setSelected(dup.id);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    const to = idx + dir;
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[to]] = [next[to], next[idx]];
    setBlocks(next);
  }

  function onDragStart(e: React.DragEvent, idx: number) {
    dragSrc.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function onDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    const src = dragSrc.current;
    if (src === null || src === targetIdx) return;
    const next = [...blocks];
    const [moved] = next.splice(src, 1);
    next.splice(targetIdx, 0, moved);
    setBlocks(next);
    dragSrc.current = null;
  }

  const selectedBlock = blocks.find((b) => b.id === selected) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--sage)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'var(--font-body)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid rgba(127,169,155,0.15)' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>منشئ الصفحة التسويقية</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>اسحب البلوكات وعدّل محتواها دون كتابة أي كود</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Display mode toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.2)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>وضع العرض:</span>
            <button
              type="button"
              onClick={toggleDisplayMode}
              disabled={togglingMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: displayMode === 'funnel_page' ? 'var(--sage)' : 'var(--cream)',
                color: displayMode === 'funnel_page' ? 'white' : 'var(--text-dark)',
                border: '1px solid rgba(127,169,155,0.3)',
              }}
            >
              {togglingMode ? <Loader2 size={12} className="animate-spin" /> : (
                displayMode === 'funnel_page' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />
              )}
              {displayMode === 'funnel_page' ? 'الصفحة التسويقية' : 'الموقع الكامل'}
            </button>
          </div>

          {/* Preview toggle */}
          <button
            type="button"
            onClick={() => setPreviewMode((p) => !p)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: previewMode ? 'var(--text-dark)' : 'var(--cream)', color: previewMode ? 'white' : 'var(--text-dark)', border: '1px solid rgba(127,169,155,0.2)' }}
          >
            {previewMode ? <EyeOff size={15} /> : <Eye size={15} />}
            {previewMode ? 'إغلاق المعاينة' : 'معاينة'}
          </button>

          {/* Save */}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: saved ? '#5A8A80' : 'var(--sage)' }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saved ? 'تم الحفظ ✓' : 'حفظ'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
          {error}
          <button type="button" onClick={() => setError(null)} className="mr-3 underline text-xs">إغلاق</button>
        </div>
      )}

      {/* ── Preview Mode ───────────────────────────────────────────────────── */}
      {previewMode ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <button type="button" onClick={() => setPreviewDevice('desktop')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: previewDevice === 'desktop' ? 'var(--sage)' : 'var(--cream)', color: previewDevice === 'desktop' ? 'white' : 'var(--text-dark)' }}>
              <Monitor size={13} /> ديسكتوب
            </button>
            <button type="button" onClick={() => setPreviewDevice('mobile')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: previewDevice === 'mobile' ? 'var(--sage)' : 'var(--cream)', color: previewDevice === 'mobile' ? 'white' : 'var(--text-dark)' }}>
              <Smartphone size={13} /> موبايل
            </button>
          </div>
          <div className="flex-1 overflow-auto flex justify-center" style={{ background: '#E5E7EB', borderRadius: 16, padding: 24 }}>
            <div
              className="bg-white overflow-y-auto"
              style={{
                width: previewDevice === 'desktop' ? 900 : 390,
                maxWidth: '100%',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                direction: 'rtl',
              }}
            >
              <InlinePreview blocks={blocks} />
            </div>
          </div>
        </div>
      ) : (
        /* ── Builder Layout ─────────────────────────────────────────────────── */
        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Block Library */}
          <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden rounded-2xl" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.15)' }}>
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>مكتبة البلوكات</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontSize: 10 }}>اضغط لإضافة بلوك</p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {BLOCK_LIBRARY.map(({ type, label, desc, Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className="w-full text-right px-3 py-2.5 rounded-xl transition-all group flex items-start gap-2"
                  style={{ background: 'var(--cream)' }}
                  title={desc}
                >
                  <Icon size={14} style={{ color: 'var(--sage)', marginTop: 2, flexShrink: 0 }} />
                  <span className="text-xs font-medium leading-snug" style={{ color: 'var(--text-dark)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-2xl" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.15)' }}>
            <div className="px-5 pt-4 pb-2 border-b" style={{ borderColor: 'rgba(127,169,155,0.1)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>الصفحة ({blocks.length} بلوك)</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {blocks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Plus size={28} style={{ color: 'rgba(127,169,155,0.4)' }} />
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>اضغط على بلوك من المكتبة لإضافته</p>
                </div>
              )}
              {blocks.map((block, idx) => {
                const isSelected = selected === block.id;
                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, idx)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, idx)}
                    onClick={() => setSelected(block.id)}
                    className="rounded-xl cursor-pointer overflow-hidden transition-all"
                    style={{
                      border: isSelected ? '2px solid var(--sage)' : '1px solid rgba(127,169,155,0.2)',
                      background: isSelected ? 'rgba(127,169,155,0.04)' : 'white',
                    }}
                  >
                    {/* Block header bar */}
                    <div
                      className="flex items-center justify-between px-3 py-1.5"
                      style={{ background: isSelected ? 'var(--sage)' : 'var(--cream)', borderBottom: '1px solid rgba(127,169,155,0.15)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <GripVertical size={12} style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', cursor: 'grab' }} />
                        <span className="text-xs font-semibold" style={{ color: isSelected ? 'white' : 'var(--text-dark)' }}>{blockLabel(block.type)}</span>
                      </div>
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <ToolBtn icon={<ChevronUp size={11} />} onClick={() => moveBlock(block.id, -1)} disabled={idx === 0} active={isSelected} title="للأعلى" />
                        <ToolBtn icon={<ChevronDown size={11} />} onClick={() => moveBlock(block.id, 1)} disabled={idx === blocks.length - 1} active={isSelected} title="للأسفل" />
                        <ToolBtn icon={<Copy size={11} />} onClick={() => duplicateBlock(block.id)} active={isSelected} title="نسخ" />
                        <ToolBtn icon={<Trash2 size={11} />} onClick={() => deleteBlock(block.id)} danger active={isSelected} title="حذف" />
                      </div>
                    </div>
                    {/* Block preview */}
                    <div style={{ pointerEvents: 'none' }}>
                      <BlockPreview block={block} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Editor Panel */}
          <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden rounded-2xl" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.15)' }}>
            <div className="px-5 pt-4 pb-2 border-b" style={{ borderColor: 'rgba(127,169,155,0.1)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                {selectedBlock ? `تعديل: ${blockLabel(selectedBlock.type)}` : 'اختاري بلوكاً للتعديل'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedBlock ? (
                <BlockEditor
                  block={selectedBlock}
                  onChange={(data) => updateBlock(selectedBlock.id, data)}
                />
              ) : (
                <p className="text-xs text-center mt-8" style={{ color: 'var(--text-muted)' }}>
                  اضغطي على أي بلوك في الصفحة لتعديل محتواه من هنا
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ icon, onClick, disabled = false, danger = false, active = false, title }: { icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; active?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
      style={{
        opacity: disabled ? 0.3 : 1,
        background: danger
          ? active ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'
          : active ? 'rgba(255,255,255,0.15)' : 'rgba(127,169,155,0.1)',
        color: danger ? '#EF4444' : active ? 'white' : 'var(--text-dark)',
      }}
    >
      {icon}
    </button>
  );
}

// ─── Inline Preview (full rendered funnel page) ────────────────────────────────

function InlineCountdown({ targetDate }: { targetDate: string }) {
  const time = useCountdown(targetDate);
  return (
    <div className="flex gap-4 justify-center">
      {[{ v: time.d, l: 'يوم' }, { v: time.h, l: 'ساعة' }, { v: time.m, l: 'دقيقة' }, { v: time.s, l: 'ثانية' }].map((u) => (
        <div key={u.l} className="text-center">
          <div className="text-3xl font-bold w-16 h-16 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            {String(u.v).padStart(2, '0')}
          </div>
          <div className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{u.l}</div>
        </div>
      ))}
    </div>
  );
}

function InlinePreview({ blocks }: { blocks: FunnelBlock[] }) {
  return (
    <div dir="rtl">
      {blocks.map((block) => {
        const d = block.data;
        switch (block.type) {
          case 'hero':
            return (
              <div key={block.id} className="px-8 py-16 text-center" style={{ background: `linear-gradient(135deg, ${d.bgColor || '#7FA99B'}, ${d.bgColor || '#5A8A80'})` }}>
                <h1 className="text-3xl font-bold text-white mb-4 leading-relaxed">{d.headline}</h1>
                <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 600, margin: '0 auto 2rem' }}>{d.subheadline}</p>
                <a href={d.ctaLink || '#'} className="inline-block px-8 py-4 rounded-full font-bold text-lg shadow-lg" style={{ background: 'white', color: d.bgColor || '#7FA99B' }}>
                  {d.ctaText || 'سجّلي الآن'}
                </a>
              </div>
            );
          case 'headline':
            return (
              <div key={block.id} className="px-8 py-12" style={{ textAlign: (d.textAlign as any) || 'center' }}>
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-dark)' }}>{d.headline}</h2>
                <p className="text-base leading-relaxed" style={{ color: 'var(--text-body)', maxWidth: 600, margin: '0 auto' }}>{d.subheadline}</p>
              </div>
            );
          case 'countdown':
            return (
              <div key={block.id} className="px-8 py-12 text-center" style={{ background: '#2D4A44' }}>
                <p className="text-xl font-bold text-white mb-6">{d.title}</p>
                <InlineCountdown targetDate={d.targetDate || new Date().toISOString()} />
                {d.subtitle && <p className="text-sm mt-6" style={{ color: 'rgba(255,255,255,0.7)' }}>{d.subtitle}</p>}
              </div>
            );
          case 'stats':
            return (
              <div key={block.id} className="px-8 py-12" style={{ background: 'var(--cream)' }}>
                <div className="flex flex-wrap gap-6 justify-center">
                  {(d.items ?? []).map((item: any, i: number) => (
                    <div key={i} className="text-center px-8 py-6 rounded-2xl" style={{ background: 'white' }}>
                      <div className="text-4xl font-bold mb-2" style={{ color: 'var(--sage-dark)' }}>{item.number}</div>
                      <div className="text-sm" style={{ color: 'var(--text-body)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          case 'qualifier':
            return (
              <div key={block.id} className="px-8 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
                <div className="max-w-xl mx-auto space-y-3">
                  {(d.items ?? []).map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--cream)' }}>
                      <span className="text-lg mt-0.5" style={{ color: 'var(--sage)' }}>✓</span>
                      <span className="text-base" style={{ color: 'var(--text-body)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          case 'bio':
            return (
              <div key={block.id} className="px-8 py-12" style={{ background: 'var(--cream)' }}>
                <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-8">
                  <div className="w-32 h-32 rounded-3xl flex-shrink-0 flex items-center justify-center text-white text-4xl font-bold" style={{ background: 'var(--sage)' }}>
                    {d.imageUrl ? <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover rounded-3xl" /> : (d.name?.[0] ?? '؟')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-dark)' }}>{d.name}</h3>
                    <p className="text-sm mb-4 font-medium" style={{ color: 'var(--sage)' }}>{d.title}</p>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--text-body)' }}>{d.bio}</p>
                  </div>
                </div>
              </div>
            );
          case 'testimonials':
            return (
              <div key={block.id} className="px-8 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
                <div className="grid grid-cols-1 gap-4" style={{ maxWidth: 800, margin: '0 auto' }}>
                  {(d.items ?? []).map((t: any, i: number) => (
                    <div key={i} className="p-6 rounded-2xl" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.2)' }}>
                      <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-body)' }}>"{t.quote}"</p>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>{t.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          case 'cta':
            return (
              <div key={block.id} id="cta" className="px-8 py-14 text-center" style={{ background: `linear-gradient(135deg, ${d.bgColor || '#7FA99B'}, ${d.bgColor || '#5A8A80'})` }}>
                <h2 className="text-2xl font-bold text-white mb-3">{d.headline}</h2>
                {d.subheadline && <p className="mb-8 text-base" style={{ color: 'rgba(255,255,255,0.9)' }}>{d.subheadline}</p>}
                <a href={d.buttonLink || '#'} className="inline-block px-10 py-4 rounded-full font-bold text-lg shadow-lg" style={{ background: 'white', color: d.bgColor || '#7FA99B' }}>
                  {d.buttonText}
                </a>
              </div>
            );
          case 'faq':
            return (
              <div key={block.id} className="px-8 py-12" style={{ background: 'var(--cream)' }}>
                <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
                <div className="max-w-2xl mx-auto space-y-3">
                  {(d.items ?? []).map((item: any, i: number) => (
                    <details key={i} className="rounded-xl overflow-hidden" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.2)' }}>
                      <summary className="px-6 py-4 font-semibold cursor-pointer" style={{ color: 'var(--text-dark)' }}>{item.question}</summary>
                      <p className="px-6 pb-4 text-base leading-relaxed" style={{ color: 'var(--text-body)' }}>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            );
          case 'guarantee':
            return (
              <div key={block.id} className="px-8 py-10 text-center">
                <div className="text-5xl mb-4">{d.icon || '🛡️'}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-dark)' }}>{d.title}</h3>
                <p className="text-base" style={{ color: 'var(--text-body)', maxWidth: 500, margin: '0 auto' }}>{d.text}</p>
              </div>
            );
          case 'bonus':
            return (
              <div key={block.id} className="px-8 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
                <div className="max-w-2xl mx-auto space-y-3">
                  {(d.items ?? []).map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--cream)' }}>
                      <span className="text-lg" style={{ color: '#F59E0B' }}>★</span>
                      <div>
                        <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-dark)' }}>{item.title}</p>
                        <p className="text-sm" style={{ color: 'var(--text-body)' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          case 'image':
            return (
              <div key={block.id} className="px-8 py-6 text-center">
                {d.imageUrl
                  ? <img src={d.imageUrl} alt={d.alt || ''} className="w-full rounded-2xl max-h-96 object-cover mx-auto" />
                  : <div className="w-full h-40 rounded-2xl flex items-center justify-center" style={{ background: 'var(--cream)', border: '2px dashed rgba(127,169,155,0.3)' }}><Image size={32} style={{ color: 'var(--sage)' }} /></div>
                }
                {d.caption && <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>{d.caption}</p>}
              </div>
            );
          case 'video':
            return (
              <div key={block.id} className="px-8 py-6">
                {d.title && <h3 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h3>}
                <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', background: '#000' }}>
                  {d.videoUrl && (d.videoUrl.includes('youtube') || d.videoUrl.includes('youtu.be'))
                    ? <iframe className="w-full h-full" src={d.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} allowFullScreen />
                    : d.videoUrl
                    ? <video src={d.videoUrl} controls className="w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center"><Video size={40} style={{ color: 'white' }} /></div>
                  }
                </div>
                {d.caption && <p className="text-sm mt-3 text-center" style={{ color: 'var(--text-muted)' }}>{d.caption}</p>}
              </div>
            );
          case 'speakers':
            return (
              <div key={block.id} className="px-8 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
                <div className="flex flex-wrap gap-6 justify-center">
                  {(d.items ?? []).map((s: any, i: number) => (
                    <div key={i} className="text-center" style={{ minWidth: 120 }}>
                      <div className="w-24 h-24 rounded-2xl mx-auto mb-3 flex items-center justify-center font-bold text-2xl text-white" style={{ background: 'var(--sage)' }}>
                        {s.imageUrl ? <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover rounded-2xl" /> : (s.name?.[0] ?? '؟')}
                      </div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>{s.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          case 'curriculum':
            return (
              <div key={block.id} className="px-8 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
                <div className="max-w-2xl mx-auto space-y-3">
                  {(d.items ?? []).map((item: any, i: number) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--cream)' }}>
                      <div className="text-sm font-bold px-3 py-1 rounded-lg h-fit" style={{ background: 'var(--sage)', color: 'white', whiteSpace: 'nowrap' }}>{item.day}</div>
                      <div>
                        <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-dark)' }}>{item.title}</p>
                        <p className="text-sm" style={{ color: 'var(--text-body)' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
