import { Calendar, Users, BookOpen, ShoppingBag, TrendingUp } from 'lucide-react';
import { loadJson, BOOKINGS_KEY, COURSES_ADMIN_KEY, PRODUCTS_ADMIN_KEY, USERS_KEY, SEED_COURSES, SEED_PRODUCTS } from './types';
import type { BookingRecord, AdminCourse, AdminProduct, SalamUser } from './types';

const STATUS_LABELS: Record<string, string> = { confirmed: 'مؤكد', pending: 'معلق', cancelled: 'ملغي' };
const STATUS_COLORS: Record<string, string> = { confirmed: '#5A8A80', pending: '#D4A435', cancelled: '#B5524A' };
const STATUS_BG: Record<string, string> = { confirmed: 'rgba(90,138,128,0.12)', pending: 'rgba(212,164,53,0.12)', cancelled: 'rgba(181,82,74,0.12)' };

export function AdminDashboard() {
  const bookings = loadJson<BookingRecord[]>(BOOKINGS_KEY, []);
  const courses = loadJson<AdminCourse[]>(COURSES_ADMIN_KEY, SEED_COURSES);
  const products = loadJson<AdminProduct[]>(PRODUCTS_ADMIN_KEY, SEED_PRODUCTS);
  const users = loadJson<SalamUser[]>(USERS_KEY, []);

  const activeCourses = courses.filter((c) => c.status === 'active').length;
  const activeProducts = products.filter((p) => p.status === 'active').length;

  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);

  /* Simple bar chart: last 7 days */
  const today = new Date();
  const DAY_SHORT = ['أح', 'اث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const dayNum = d.getDate();
    const dayName = DAY_SHORT[d.getDay()];
    return {
      label: dayName,
      sublabel: String(dayNum),
      count: bookings.filter((b) => b.date === key).length,
    };
  });
  const maxCount = Math.max(...last7.map((d) => d.count), 1);

  const stats = [
    { label: 'إجمالي الحجوزات', value: bookings.length, Icon: Calendar, color: 'var(--sage)' },
    { label: 'إجمالي المستخدمين', value: users.length, Icon: Users, color: 'var(--blush)' },
    { label: 'الدورات النشطة', value: activeCourses, Icon: BookOpen, color: 'var(--sage-dark)' },
    { label: 'المنتجات', value: activeProducts, Icon: ShoppingBag, color: '#D4A435' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>الإحصائيات</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>نظرة عامة على نشاط الموقع</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.15)', boxShadow: '0 4px 20px rgba(90,138,128,0.08)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <TrendingUp size={14} style={{ color: 'var(--sage)' }} />
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-dark)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.15)', boxShadow: '0 2px 12px rgba(90,138,128,0.08)' }}>
          <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text-dark)' }}>الحجوزات – آخر ٧ أيام</h2>
          <div className="space-y-2">
            {/* Bars */}
            <div className="flex items-end gap-2" style={{ height: 96 }}>
              {last7.map(({ label, count }) => (
                <div key={label} className="flex-1 flex flex-col items-center justify-end gap-1">
                  {count > 0 && (
                    <span className="text-xs font-bold leading-none" style={{ color: 'var(--sage-dark)' }}>{count}</span>
                  )}
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${Math.max((count / maxCount) * 80, count > 0 ? 8 : 3)}px`,
                      background: count > 0 ? 'var(--sage)' : 'var(--cream-dark)',
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Day labels */}
            <div className="flex gap-2">
              {last7.map(({ label, sublabel }) => (
                <div key={sublabel} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[11px] font-medium leading-none" style={{ color: 'var(--text-dark)' }}>{label}</span>
                  <span className="text-[10px] leading-none" style={{ color: 'var(--text-muted)' }}>{sublabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid rgba(127,169,155,0.15)', boxShadow: '0 2px 12px rgba(90,138,128,0.08)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(127,169,155,0.1)' }}>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-dark)' }}>آخر الحجوزات</h2>
          </div>
          {recent.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>لا توجد حجوزات بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(127,169,155,0.08)' }}>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-dark)' }}>الاسم</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-dark)' }}>النوع</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-dark)' }}>التاريخ</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-dark)' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((b) => (
                    <tr key={b.id} className="border-t" style={{ borderColor: 'rgba(127,169,155,0.08)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-dark)' }}>{b.name || '—'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{b.sessionType || '—'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{b.date} {b.slot}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: STATUS_BG[b.status] ?? STATUS_BG.pending, color: STATUS_COLORS[b.status] ?? STATUS_COLORS.pending }}>
                          {STATUS_LABELS[b.status] ?? 'معلق'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
