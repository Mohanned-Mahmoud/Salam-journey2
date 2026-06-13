import { useEffect, useState } from 'react';
import { Trash2, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiJson } from '@/lib/api';
import type { BookingRecord, BookingStatus } from './types';

const STATUS_LABELS: Record<BookingStatus, string> = { confirmed: 'مؤكد', pending: 'معلق', cancelled: 'ملغي' };
const STATUS_COLORS: Record<BookingStatus, string> = { confirmed: '#5A8A80', pending: '#D4A435', cancelled: '#B5524A' };
const STATUS_BG: Record<BookingStatus, string> = { confirmed: 'rgba(90,138,128,0.12)', pending: 'rgba(212,164,53,0.12)', cancelled: 'rgba(181,82,74,0.12)' };

const PAGE_SIZE = 10;

export function AdminBookings() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      try {
        setLoading(true);
        // 🌟 جلب كائنات المستخدمين المحمية والتي تحتوي الحجوزات بداخلها جاهزة ومهيأة بالكامل
        const usersData = await apiJson<any[]>('/admin/users');
        
        if (!cancelled) {
          const allBookings = usersData.flatMap((u) => u.bookings || []) as BookingRecord[];
          setBookings(allBookings);
        }
      } catch {
        if (!cancelled) {
          setError('تعذر تحميل الحجوزات من قاعدة البيانات حية');
          setBookings([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBookings();
    return () => {
      cancelled = true;
    };
  }, []);

  async function changeStatus(id: string, status: BookingStatus) {
    const current = bookings.find((b) => b.id === id);
    if (!current) return;
    try {
      const updated = await apiJson<BookingRecord>(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...current, status }),
      });
      setBookings((items) => items.map((b) => (b.id === id ? updated : b)));
    } catch {
      // error handling
    }
  }

  async function confirmDelete(id: string) {
    try {
      await apiJson(`/bookings/${id}`, { method: 'DELETE' });
      setBookings((items) => items.filter((b) => b.id !== id));
      setDeleteId(null);
    } catch {
      // error handling
    }
  }

  function exportCSV() {
    const headers = ['الاسم', 'البريد', 'الواتساب', 'نوع الجلسة', 'الخطة', 'التاريخ', 'الوقت', 'الحالة'];
    const rows = bookings.map((b) => [b.name, b.email, b.whatsapp, b.sessionType, b.bookingKind === 'package' ? `باقة ${b.packageSessionsTotal ?? 3} جلسات` : 'جلسة فردية', b.date, b.slot, STATUS_LABELS[b.status]]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'bookings.csv';
    a.click();
  }

  const filtered = bookings.filter((b) => {
    const matchFilter = filter === 'all' || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.name?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>إدارة الحجوزات</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{bookings.length} حجز فعلي في قاعدة البيانات</p>
        </div>
        <button type="button" onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--sage)', color: 'white' }}>
          <Download size={15} /> تصدير CSV
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>جارٍ تحميل الحجوزات من Neon DB...</p>}
      {!loading && error && <p className="text-sm" style={{ color: '#B5524A' }}>{error}</p>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl ps-9 pe-4 py-2.5 text-sm outline-none"
            style={{ background: 'white', border: '1px solid rgba(127,169,155,0.25)', color: 'var(--text-dark)' }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setFilter(s); setPage(1); }}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filter === s ? 'var(--sage)' : 'white',
                color: filter === s ? 'white' : 'var(--text-body)',
                border: '1px solid rgba(127,169,155,0.2)',
              }}
            >
              {s === 'all' ? 'الكل' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 2px 12px rgba(90,138,128,0.08)', border: '1px solid rgba(127,169,155,0.12)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(127,169,155,0.08)' }}>
                {['#', 'الاسم', 'البريد', 'الواتساب', 'نوع الجلسة', 'الخطة', 'التاريخ', 'الوقت', 'الحالة', 'إجراءات'].map((h) => (
                  <th key={h} className="text-right px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--text-dark)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>لا توجد نتائج</td></tr>
              ) : paged.map((b, i) => (
                <tr key={b.id} className="border-t" style={{ borderColor: 'rgba(127,169,155,0.08)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-dark)' }}>{b.name || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{b.email || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-body)' }}>{b.whatsapp || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-body)' }}>{b.sessionType || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-body)' }}>
                    {b.bookingKind === 'package' ? `باقة ${b.packageSessionsTotal ?? 3} جلسات` : 'جلسة فردية'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-body)' }}>{b.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-body)' }}>{b.slot}</td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => void changeStatus(b.id, e.target.value as BookingStatus)}
                      className="rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
                      style={{ background: STATUS_BG[b.status], color: STATUS_COLORS[b.status], border: 'none' }}
                    >
                      {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-50">
                      <Trash2 size={15} style={{ color: '#B5524A' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'rgba(127,169,155,0.1)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} من {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-lg disabled:opacity-40" style={{ border: '1px solid rgba(127,169,155,0.25)' }}>
                <ChevronRight size={16} style={{ color: 'var(--text-dark)' }} />
              </button>
              <span className="text-sm font-medium" style={{ color: 'var(--text-dark)' }}>{page} / {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-1.5 rounded-lg disabled:opacity-40" style={{ border: '1px solid rgba(127,169,155,0.25)' }}>
                <ChevronLeft size={16} style={{ color: 'var(--text-dark)' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,74,69,0.5)' }}>
          <div className="rounded-2xl p-8 max-w-sm w-full text-center space-y-4" style={{ background: 'white' }}>
            <p className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>هل أنت متأكد؟</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>سيتم حذف هذا الحجز نهائياً ولا يمكن التراجع.</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => void confirmDelete(deleteId)} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#B5524A' }}>حذف</button>
              <button type="button" onClick={() => setDeleteId(null)} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--cream)', color: 'var(--text-dark)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}