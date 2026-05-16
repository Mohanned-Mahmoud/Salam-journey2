import { BarChart2, Calendar, BookOpen, ShoppingBag, Users, MessageSquare, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import type { AdminSection } from './types';

const ADMIN_SESSION_KEY = "salam_admin_session";

type Props = {
  active: AdminSection;
  onChange: (s: AdminSection) => void;
  onLogout?: () => void;
};

const ITEMS: { id: AdminSection; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard',    label: 'الإحصائيات',  Icon: LayoutDashboard },
  { id: 'bookings',     label: 'الحجوزات',    Icon: Calendar },
  { id: 'courses',      label: 'الدورات',     Icon: BookOpen },
  { id: 'products',     label: 'المنتجات',    Icon: ShoppingBag },
  { id: 'users',        label: 'المستخدمون',  Icon: Users },
  { id: 'testimonials', label: 'الشهادات',    Icon: MessageSquare },
  { id: 'settings',     label: 'الإعدادات',   Icon: Settings },
];

export function AdminSidebar({ active, onChange, onLogout }: Props) {
  function handleLogout() {
    if (onLogout) { onLogout(); return; }
    localStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.reload();
  }

  return (
    <aside
      className="flex flex-col h-full"
      style={{ background: 'var(--text-dark)', color: 'var(--cream)', width: 260, minWidth: 260 }}
    >
      <div className="px-6 py-7 border-b" style={{ borderColor: 'rgba(250,245,232,0.1)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
            style={{ background: 'var(--sage)', color: 'white' }}
          >
            س
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--cream)' }}>رحلة سلام</p>
            <p className="text-xs" style={{ color: 'rgba(250,245,232,0.55)' }}>لوحة التحكم</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-right transition-all"
              style={{
                background: isActive ? 'var(--sage)' : 'transparent',
                color: isActive ? 'white' : 'rgba(250,245,232,0.75)',
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-6 border-t pt-4" style={{ borderColor: 'rgba(250,245,232,0.1)' }}>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-right transition-all"
          style={{ color: 'rgba(250,245,232,0.6)' }}
        >
          <LogOut size={17} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
