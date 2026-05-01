import { useState } from 'react';
import { Search, Trash2, Eye, X } from 'lucide-react';
import { loadJson, saveJson, USERS_KEY } from './types';
import type { SalamUser, BookingRecord } from './types';

export function AdminUsers() {
  const [users, setUsers] = useState<SalamUser[]>(() => loadJson<SalamUser[]>(USERS_KEY, []));
  const [search, setSearch] = useState('');
  const [viewUser, setViewUser] = useState<SalamUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function persist(next: SalamUser[]) { setUsers(next); saveJson(USERS_KEY, next); }
  function confirmDelete() { if (deleteId) persist(users.filter((u) => u.id !== deleteId)); setDeleteId(null); }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>إدارة المستخدمين</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{users.length} مستخدم مسجّل</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl ps-9 pe-4 py-2.5 text-sm outline-none"
          style={{ background: 'white', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 2px 12px rgba(90,138,128,0.08)', border: '1px solid rgba(127,169,155,0.12)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(127,169,155,0.08)' }}>
              {['#', 'الاسم', 'البريد', 'الواتساب', 'الدورات', 'الحجوزات', 'إجراءات'].map((h) => (
                <th key={h} className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-dark)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                {users.length === 0 ? 'لا يوجد مستخدمون مسجّلون بعد' : 'لا توجد نتائج'}
              </td></tr>
            ) : filtered.map((u, i) => (
              <tr key={u.id} className="border-t" style={{ borderColor: 'rgba(127,169,155,0.08)' }}>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-dark)' }}>{u.name}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{u.email}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{u.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(90,138,128,0.1)', color: 'var(--sage-dark)' }}>
                    {u.enrolledCourses?.length ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(127,169,155,0.1)', color: 'var(--text-dark)' }}>
                    {u.bookings?.length ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setViewUser(u)} className="p-1.5 rounded-lg hover:bg-[var(--cream)]"><Eye size={14} style={{ color: 'var(--sage-dark)' }} /></button>
                    <button type="button" onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} style={{ color: '#B5524A' }} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User detail modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,74,69,0.5)' }}>
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--cream-dark)' }}>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>تفاصيل المستخدم</h2>
              <button type="button" onClick={() => setViewUser(null)}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: 'var(--sage)' }}>
                  {viewUser.name?.charAt(0) ?? '؟'}
                </div>
                <div>
                  <p className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>{viewUser.name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{viewUser.email}</p>
                  {viewUser.phone && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{viewUser.phone}</p>}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-dark)' }}>الدورات المشتركة ({viewUser.enrolledCourses?.length ?? 0})</p>
                {(viewUser.enrolledCourses?.length ?? 0) === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>لا توجد دورات</p>
                ) : (
                  <ul className="space-y-1">
                    {viewUser.enrolledCourses.map((c) => (
                      <li key={c.id} className="text-sm px-3 py-2 rounded-xl" style={{ background: 'var(--cream)', color: 'var(--text-body)' }}>
                        {c.id} — <span style={{ color: 'var(--text-muted)' }}>{new Date(c.enrolledAt).toLocaleDateString('ar-EG')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-dark)' }}>الحجوزات ({viewUser.bookings?.length ?? 0})</p>
                {(viewUser.bookings?.length ?? 0) === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>لا توجد حجوزات</p>
                ) : (
                  <ul className="space-y-1">
                    {viewUser.bookings.map((b: BookingRecord) => (
                      <li key={b.id} className="text-sm px-3 py-2 rounded-xl" style={{ background: 'var(--cream)', color: 'var(--text-body)' }}>
                        {b.sessionType} — {b.date} {b.slot}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,74,69,0.5)' }}>
          <div className="rounded-2xl p-8 max-w-sm w-full text-center space-y-4" style={{ background: 'white' }}>
            <p className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>حذف المستخدم؟</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>سيتم حذف حساب المستخدم نهائياً.</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={confirmDelete} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#B5524A' }}>حذف</button>
              <button type="button" onClick={() => setDeleteId(null)} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--cream)', color: 'var(--text-dark)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
