import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'wouter';
import { AdminSidebar } from './sidebar';
import { AdminDashboard } from './dashboard';
import { AdminBookings } from './bookings';
import { AdminCourses } from './courses-admin';
import { AdminProducts } from './products-admin';
import { AdminUsers } from './users-admin';
import { AdminTestimonials } from './testimonials-admin';
import { AdminSettings } from './settings-admin';
import { AdminAiKnowledge } from './ai-knowledge-admin';
import { useAuth } from '@/hooks/use-auth'; // 🌟 استيراد الهوك الموحد
import type { AdminSection } from './types';

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { logout } = useAuth(); // 🌟 سحب دالة تسجيل الخروج الموحدة
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = 'لوحة التحكم — رحلة سلام';
    return () => { document.title = 'رحلة سلام'; };
  }, []);

  // 🚪 دالة تسجيل الخروج الموحدة لجميع الحسابات والآدمن
  function handleLogout() {
    logout();
    navigate('/');
  }

  const SECTIONS: Record<AdminSection, React.ReactNode> = {
    dashboard: <AdminDashboard />,
    bookings: <AdminBookings />,
    courses: <AdminCourses />,
    products: <AdminProducts />,
    users: <AdminUsers />,
    testimonials: <AdminTestimonials />,
    'ai-knowledge': <AdminAiKnowledge />,
    settings: <AdminSettings />,
  };

  return (
    <div dir="rtl" className="flex h-screen overflow-hidden" style={{ background: '#F4F6F5', fontFamily: 'var(--font-body)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0 h-full overflow-y-auto">
        <AdminSidebar active={section} onChange={(s) => setSection(s)} onLogout={handleLogout} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex flex-col flex-shrink-0 h-full overflow-y-auto" style={{ width: 260 }}>
            <AdminSidebar active={section} onChange={(s) => { setSection(s); setSidebarOpen(false); }} onLogout={handleLogout} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'white', borderColor: 'rgba(127,169,155,0.15)' }}>
          <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl" style={{ background: 'var(--cream)' }}>
            <Menu size={20} style={{ color: 'var(--text-dark)' }} />
          </button>
          <span className="font-bold" style={{ color: 'var(--text-dark)' }}>لوحة التحكم — رحلة سلام</span>
        </div>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {SECTIONS[section]}
        </main>
      </div>
    </div>
  );
}