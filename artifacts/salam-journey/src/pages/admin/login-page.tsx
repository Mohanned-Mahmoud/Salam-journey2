import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLocation } from 'wouter';
import { ADMIN_SESSION_KEY } from './types';

function getToken(): string {
  return localStorage.getItem(ADMIN_SESSION_KEY) ?? '';
}

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    document.title = 'دخول المسؤول — رحلة سلام';
    return () => { document.title = 'رحلة سلام'; };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { setChecking(false); return; }
    fetch('/api/admin/verify', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (r.ok) navigate('/admin'); else setChecking(false); })
      .catch(() => setChecking(false));
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        return;
      }
      const data = await res.json() as { token: string };
      localStorage.setItem(ADMIN_SESSION_KEY, data.token);
      navigate('/admin');
    } catch {
      setError('تعذّر الاتصال بالخادم، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
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
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>البريد الإلكتروني</label>
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
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'var(--sage-dark)' }}
            >
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
