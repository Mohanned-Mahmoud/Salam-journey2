import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth'; // 🌟 استيراد الهوك الموحد للسيستم

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading, login } = useAuth(); // 🌟 سحب الصلاحيات والدوال الموحدة
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'دخول المسؤول — رحلة سلام';
    return () => { document.title = 'رحلة سلام'; };
  }, []);

  // 🛡️ جدار حماية عكسي: لو المسؤول مسجل دخول أصلاً ورتبته admin، حوله فوراً للوحة التحكم
  useEffect(() => {
    if (!isLoading && isAuthenticated && (user as any)?.role === 'admin') {
      navigate('/admin');
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      // 🌟 بننادي على دالة الـ login الموحدة للسيستم اللي بتبص في جدول usersTable الحقيقي
      const res = await login(email.trim().toLowerCase(), password);
      
      if (res.ok) {
        // الهوك لوحده هيعمل hydrate للبيانات ويحدث الـ State
        navigate('/admin');
      } else {
        if (res.error === 'not_found' || res.error === 'wrong_password') {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب لا يمتلك صلاحيات مسؤول');
        } else {
          setError('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مجدداً');
        }
      }
    } catch {
      setError('تعذّر الاتصال بالخادم، يرجى المحاولة مجدداً');
    } finally {
      setSubmitting(false);
    }
  }

  // طالما السيستم بيتحقق من التوكن الموحد في الخلفية، اظهر شاشة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--sage)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'var(--sage-dark)' }}
          >س</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>لوحة التحكم</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>رحلة سلام — دخول المسؤول</p>
        </div>

        <div
          className="rounded-3xl p-8"
          style={{ background: 'white', boxShadow: '0 20px 60px rgba(45,74,69,0.12)', border: '1px solid rgba(127,169,155,0.15)' }}
        >
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(181,82,74,0.1)', color: '#B5524A' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>البريد الإلكتروني للمسؤول</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.3)', color: 'var(--text-dark)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl px-4 py-3 pe-10 text-sm outline-none"
                  style={{ background: 'var(--cream)', border: '1px solid rgba(127,169,155,0.3)', color: 'var(--text-dark)' }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute top-1/2 -translate-y-1/2 end-3">
                  {showPwd
                    ? <EyeOff size={16} style={{ color: 'var(--text-muted)' }} />
                    : <Eye size={16} style={{ color: 'var(--text-muted)' }} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'var(--sage-dark)' }}
            >
              {submitting ? 'جاري التحقق من الصلاحيات...' : 'دخول اللوحة'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}