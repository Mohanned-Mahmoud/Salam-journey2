import { useState, useEffect } from 'react';
import { apiJson } from '@/lib/api';
import type { FunnelBlock } from './admin/types';

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

const getSlugFromUrl = () => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'main';
};

function CountdownBlock({ data }: { data: Record<string, any> }) {
  const time = useCountdown(data.targetDate || new Date().toISOString());
  return (
    <section className="px-6 py-14 text-center" style={{ background: '#2D4A44' }}>
      <p className="text-xl font-bold text-white mb-8">{data.title}</p>
      <div className="flex gap-4 justify-center flex-wrap">
        {[{ v: time.d, l: 'يوم' }, { v: time.h, l: 'ساعة' }, { v: time.m, l: 'دقيقة' }, { v: time.s, l: 'ثانية' }].map((u) => (
          <div key={u.l} className="text-center">
            <div className="text-4xl font-bold w-20 h-20 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
              {String(u.v).padStart(2, '0')}
            </div>
            <div className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.75)' }}>{u.l}</div>
          </div>
        ))}
      </div>
      {data.subtitle && <p className="text-sm mt-8" style={{ color: 'rgba(255,255,255,0.65)' }}>{data.subtitle}</p>}
    </section>
  );
}

function RegistrationFormBlock({ data, pageId }: { data: Record<string, any>; pageId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const safeRedirectTarget = typeof data.redirectTargetId === 'string' && data.redirectTargetId.trim()
    ? data.redirectTargetId.trim()
    : '/';

  const triggerDownload = (url: string, fileName?: string) => {
    const link = document.createElement('a');
    link.href = url;
    if (fileName) link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    requestAnimationFrame(() => {
      link.click();
      window.setTimeout(() => link.remove(), 0);
    });
  };

  const handleGiftAndRedirect = () => {
    if (data.giftUrl) {
      triggerDownload(data.giftUrl, data.giftName ? data.giftName : undefined);
    }
    window.setTimeout(() => {
      window.location.assign(safeRedirectTarget);
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await apiJson('/funnel/register', {
        method: 'POST',
        body: JSON.stringify({ pageId, name, email, phone }),
      });
      setStatus('success');
      setName('');
      setEmail('');
      setPhone('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="px-6 py-12 max-w-lg mx-auto bg-white shadow-xl rounded-3xl my-8 border border-gray-100">
      <h3 className="text-xl font-bold text-center mb-6 text-gray-800">{data.title || 'سجلي بياناتك الآن'}</h3>
      {status === 'success' ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-center font-semibold">تم تسجيل بياناتك بنجاح! سنتواصل معكِ قريباً.</div>
          {(data.giftUrl || data.giftName) && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center space-y-3">
              <p className="text-sm font-bold text-emerald-900">{data.giftName ? `يتم الآن تجهيز: ${data.giftName}` : 'يتم الآن تجهيز الهدية الخاصة بكِ'}</p>
            </div>
          )}
          <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-4 text-center space-y-3">
            <p className="text-sm font-bold text-gray-700">اضغطي الزر لتنزيل الهدية ثم الانتقال للصفحة التالية</p>
            <button
              type="button"
              onClick={handleGiftAndRedirect}
              className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-all w-full"
            >
              {data.giftUrl ? 'تحميل الهدية والانتقال' : 'الانتقال للصفحة التالية'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-600">الاسم بالكامل</label>
            <input required type="text" className="w-full border rounded-xl px-4 py-2 text-sm outline-none bg-gray-50 text-black" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-600">البريد الإلكتروني</label>
            <input required type="email" className="w-full border rounded-xl px-4 py-2 text-sm outline-none bg-gray-50 text-black" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-600">رقم الهاتف (واتساب)</label>
            <input type="tel" className="w-full border rounded-xl px-4 py-2 text-sm outline-none bg-gray-50 text-black" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {status === 'error' && <p className="text-xs text-red-600 font-medium">حدث خطأ أثناء الإرسال.</p>}
          <button type="submit" disabled={status === 'loading'} className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow transition-all">
            {status === 'loading' ? 'جاري الإرسال...' : (data.buttonText || 'إرسال')}
          </button>
        </form>
      )}
    </section>
  );
}

function renderBlock(block: FunnelBlock, pageId: string) {
  const d = block.data;
  switch (block.type) {
    case 'hero':
      return (
        <section key={block.id} className="px-6 py-16 md:py-24 text-center" style={{ background: `linear-gradient(135deg, ${d.bgColor || '#7FA99B'}, ${d.bgColor ? d.bgColor + 'CC' : '#5A8A80'})` }}>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-relaxed">{d.headline}</h1>
            <p className="text-lg md:text-xl mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>{d.subheadline}</p>
            <a
              href={d.ctaTargetId || d.ctaLink || '#'}
              className="inline-block px-10 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl"
              style={{ background: 'white', color: d.bgColor || '#7FA99B' }}
            >
              {d.ctaText || 'سجّلي الآن'}
            </a>
          </div>
        </section>
      );

    case 'headline':
      return (
        <section key={block.id} className="px-6 py-12 md:py-16" style={{ textAlign: (d.textAlign as any) || 'center' }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-relaxed" style={{ color: 'var(--text-dark)' }}>{d.headline}</h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-body)' }}>{d.subheadline}</p>
          </div>
        </section>
      );

    case 'countdown':
      return <CountdownBlock key={block.id} data={d} />;

    case 'stats':
      return (
        <section key={block.id} className="px-6 py-12" style={{ background: 'var(--cream)' }}>
          <div className="max-w-4xl mx-auto flex flex-wrap gap-6 justify-center">
            {(d.items ?? []).map((item: any, i: number) => (
              <div key={i} className="text-center px-8 py-6 rounded-2xl shadow-sm flex-1" style={{ background: 'white', minWidth: 120, maxWidth: 180 }}>
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--sage-dark)' }}>{item.number}</div>
                <div className="text-sm" style={{ color: 'var(--text-body)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'qualifier':
      return (
        <section key={block.id} className="px-6 py-12 md:py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
            <div className="space-y-3">
              {(d.items ?? []).map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl" style={{ background: 'var(--cream)' }}>
                  <span className="text-xl mt-0.5 flex-shrink-0" style={{ color: 'var(--sage)' }}>✓</span>
                  <span className="text-base leading-relaxed" style={{ color: 'var(--text-body)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'bio':
      return (
        <section key={block.id} className="px-6 py-12 md:py-16" style={{ background: 'var(--cream)' }}>
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div
              className="w-36 h-36 rounded-3xl flex-shrink-0 flex items-center justify-center text-white text-5xl font-bold shadow-lg overflow-hidden"
              style={{ background: 'var(--sage)' }}
            >
              {d.imageUrl
                ? <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover" />
                : (d.name?.[0] ?? '؟')
              }
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>{d.name}</h3>
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--sage)' }}>{d.title}</p>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-body)' }}>{d.bio}</p>
            </div>
          </div>
        </section>
      );

    case 'speakers':
      return (
        <section key={block.id} className="px-6 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
            <div className="flex flex-wrap gap-8 justify-center">
              {(d.items ?? []).map((s: any, i: number) => (
                <div key={i} className="text-center" style={{ minWidth: 140 }}>
                  <div
                    className="w-28 h-28 rounded-2xl mx-auto mb-3 flex items-center justify-center font-bold text-3xl text-white shadow overflow-hidden"
                    style={{ background: 'var(--sage)' }}
                  >
                    {s.imageUrl ? <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" /> : (s.name?.[0] ?? '؟')}
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-dark)' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'curriculum':
      return (
        <section key={block.id} className="px-6 py-12 md:py-16" style={{ background: 'var(--cream)' }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
            <div className="space-y-3">
              {(d.items ?? []).map((item: any, i: number) => (
                <div key={i} className="flex gap-4 p-5 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.15)' }}>
                  <div className="text-sm font-bold px-3 py-1.5 rounded-xl h-fit flex-shrink-0" style={{ background: 'var(--sage)', color: 'white' }}>{item.day}</div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section key={block.id} className="px-6 py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(d.items ?? []).map((t: any, i: number) => (
                <div key={i} className="p-6 rounded-2xl" style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.2)' }}>
                  <div className="flex mb-3">
                    {[1,2,3,4,5].map((s) => <span key={s} style={{ color: '#F59E0B' }}>★</span>)}
                  </div>
                  <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-body)' }}>"{t.quote}"</p>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'image':
      return (
        <section key={block.id} className="px-6 py-10 max-w-4xl mx-auto">
          {d.text ? (
            <div className={`flex flex-col md:flex-row gap-8 items-center ${d.imagePosition === 'left' ? 'md:flex-row-reverse' : ''}`}>
              <div className="w-full md:w-1/2">
                <img src={d.imageUrl || 'https://placehold.co/600x400'} alt={d.alt || ''} className="w-full rounded-2xl shadow-md object-cover max-h-96" />
              </div>
              <div className="w-full md:w-1/2 space-y-3 text-right">
                <p className="text-base md:text-lg leading-relaxed text-gray-700 whitespace-pre-line">{d.text}</p>
                {d.caption && <p className="text-xs text-gray-400">{d.caption}</p>}
              </div>
            </div>
          ) : (
            <div className="text-center w-full">
              {d.imageUrl && <img src={d.imageUrl} alt={d.alt || ''} className="w-full rounded-2xl shadow-md object-cover max-h-[500px]" />}
              {d.caption && <p className="text-sm mt-3 text-gray-500">{d.caption}</p>}
            </div>
          )}
        </section>
      );

    case 'video':
      return (
        <section key={block.id} className="px-6 py-8">
          <div className="max-w-3xl mx-auto">
            {d.title && <h3 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h3>}
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '16/9', background: '#000' }}>
              {d.videoUrl && (d.videoUrl.includes('youtube') || d.videoUrl.includes('youtu.be'))
                ? <iframe className="w-full h-full" src={d.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} allowFullScreen />
                : d.videoUrl
                ? <video src={d.videoUrl} controls className="w-full h-full" />
                : null
              }
            </div>
            {d.caption && <p className="text-sm mt-3 text-center" style={{ color: 'var(--text-muted)' }}>{d.caption}</p>}
          </div>
        </section>
      );

    case 'cta':
      return (
        <section key={block.id} id="cta" className="px-6 py-16 text-center" style={{ background: `linear-gradient(135deg, ${d.bgColor || '#7FA99B'}, ${d.bgColor ? d.bgColor + 'CC' : '#5A8A80'})` }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{d.headline}</h2>
            {d.subheadline && <p className="text-base mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>{d.subheadline}</p>}
            <a
              href={d.buttonTargetId || d.buttonLink || '#'}
              className="inline-block px-10 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl"
              style={{ background: 'white', color: d.bgColor || '#7FA99B' }}
            >
              {d.buttonText}
            </a>
          </div>
        </section>
      );

    case 'registration_form' as any:
      return <RegistrationFormBlock key={block.id} data={d} pageId={pageId} />;

    case 'bonus':
      return (
        <section key={block.id} className="px-6 py-12 md:py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
            <div className="space-y-3">
              {(d.items ?? []).map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl" style={{ background: 'var(--cream)' }}>
                  <span className="text-2xl flex-shrink-0" style={{ color: '#F59E0B' }}>★</span>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'faq':
      return (
        <section key={block.id} className="px-6 py-12 md:py-16" style={{ background: 'var(--cream)' }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: 'var(--text-dark)' }}>{d.title}</h2>
            <div className="space-y-3">
              {(d.items ?? []).map((item: any, i: number) => (
                <details key={i} className="group rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.2)' }}>
                  <summary className="px-6 py-4 font-semibold cursor-pointer list-none flex items-center justify-between" style={{ color: 'var(--text-dark)' }}>
                    {item.question}
                    <span className="text-xl" style={{ color: 'var(--sage)' }}>+</span>
                  </summary>
                  <p className="px-6 pb-5 text-base leading-relaxed" style={{ color: 'var(--text-body)', borderTop: '1px solid rgba(127,169,155,0.12)' }}>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      );

    case 'guarantee':
      return (
        <section key={block.id} className="px-6 py-12 text-center">
          <div className="max-w-lg mx-auto p-8 rounded-3xl" style={{ background: 'var(--cream)', border: '2px solid rgba(127,169,155,0.3)' }}>
            <div className="text-6xl mb-4">{d.icon || '🛡️'}</div>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-dark)' }}>{d.title}</h3>
            <p className="text-base leading-relaxed" style={{ color: 'var(--text-body)' }}>{d.text}</p>
          </div>
        </section>
      );

    default:
      return null;
  }
}

export default function FunnelPage() {
  const [blocks, setBlocks] = useState<FunnelBlock[]>([]);
  const [pageId, setPageId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'رحلة سلام';
    const slug = getSlugFromUrl();
    apiJson<{ id: string; blocks: FunnelBlock[] }>(`/funnel-page/${slug}`)
      .then((page) => {
        setPageId(page.id);
        setBlocks(Array.isArray(page.blocks) ? page.blocks : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--cream)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--sage)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen" style={{ fontFamily: 'var(--font-body)', background: 'white' }}>
      {blocks.map((block) => renderBlock(block, pageId))}
      {blocks.length === 0 && (
        <div className="flex items-center justify-center min-h-screen text-center px-6">
          <div>
            <p className="text-2xl font-bold mb-3" style={{ color: 'var(--text-dark)' }}>الصفحة التسويقية</p>
            <p style={{ color: 'var(--text-muted)' }}>قومي ببناء الصفحة من لوحة التحكم → الصفحة التسويقية</p>
          </div>
        </div>
      )}
    </div>
  );
}
