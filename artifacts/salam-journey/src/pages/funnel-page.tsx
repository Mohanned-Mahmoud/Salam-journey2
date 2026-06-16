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

function renderBlock(block: FunnelBlock) {
  const d = block.data;
  switch (block.type) {
    case 'hero':
      return (
        <section key={block.id} className="px-6 py-16 md:py-24 text-center" style={{ background: `linear-gradient(135deg, ${d.bgColor || '#7FA99B'}, ${d.bgColor ? d.bgColor + 'CC' : '#5A8A80'})` }}>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-relaxed">{d.headline}</h1>
            <p className="text-lg md:text-xl mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>{d.subheadline}</p>
            <a
              href={d.ctaLink || '#'}
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
        <section key={block.id} className="px-6 py-8 text-center">
          {d.imageUrl
            ? <img src={d.imageUrl} alt={d.alt || ''} className="w-full max-w-3xl mx-auto rounded-2xl shadow-md max-h-96 object-cover" />
            : null
          }
          {d.caption && <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>{d.caption}</p>}
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
              href={d.buttonLink || '#'}
              className="inline-block px-10 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl"
              style={{ background: 'white', color: d.bgColor || '#7FA99B' }}
            >
              {d.buttonText}
            </a>
          </div>
        </section>
      );

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'رحلة سلام';
    apiJson<{ blocks: FunnelBlock[] }>('/funnel-page')
      .then((page) => setBlocks(Array.isArray(page.blocks) ? page.blocks : []))
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
      {blocks.map(renderBlock)}
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
