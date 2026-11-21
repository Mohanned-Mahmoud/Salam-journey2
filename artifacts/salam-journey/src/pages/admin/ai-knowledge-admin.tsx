import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Brain,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
  Zap,
  Bot,
  Languages,
  Cpu,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { apiJson } from '@/lib/api';

type KnowledgeEntry = { id: string; title: string; content: string; updatedAt: string };

type AiConfigStatus = {
  configured: boolean;
  maskedKey: string;
  source: 'database' | 'env' | 'none';
  provider: string;
  model: string;
  services: {
    chat: boolean;
    translation: boolean;
    ragEmbeddings: boolean;
  };
};

type TestConnectionResult = {
  success: boolean;
  latencyMs: number;
  message: string;
  error?: string;
  model?: string;
};

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl p-6 space-y-4 shadow-sm"
      style={{
        background: '#fff',
        border: '1px solid rgba(127,169,155,0.22)',
        boxShadow: '0 4px 20px -2px rgba(46,62,55,0.04)',
      }}
    >
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'rgba(127,169,155,0.12)' }}>
        {icon}
        <h2 className="font-bold text-base" style={{ color: 'var(--text-dark)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EntryRow({
  entry,
  onSave,
  onDelete,
}: {
  entry: KnowledgeEntry;
  onSave: (id: string, title: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = title !== entry.title || content !== entry.content;

  async function save() {
    setSaving(true);
    await onSave(entry.id, title, content);
    setSaving(false);
  }

  async function del() {
    if (!confirm('هل أنتِ متأكدة من حذف هذا الإدخال من قاعدة المعرفة؟')) return;
    setDeleting(true);
    await onDelete(entry.id);
  }

  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all";
  const inpStyle = {
    background: 'var(--cream)',
    border: '1px solid rgba(127,169,155,0.25)',
    color: 'var(--text-dark)',
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all shadow-xs"
      style={{ border: '1px solid rgba(127,169,155,0.2)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-right transition-colors"
        style={{ background: open ? 'var(--sage-muted)' : 'var(--cream)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: dirty ? '#EAB308' : 'var(--sage-dark)' }}
          />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">تعديلات غير محفوظة</span>}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="p-5 space-y-4" style={{ background: '#fff' }}>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>العنوان</label>
            <input className={inp} style={inpStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>المحتوى</label>
            <textarea
              className={inp}
              style={{ ...inpStyle, minHeight: 130, resize: 'vertical' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={del}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'rgba(181,82,74,0.08)', color: '#B5524A' }}
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              حذف
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 shadow-sm"
              style={{ background: 'var(--sage-dark)' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              حفظ التعديلات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminAiKnowledge() {
  // Knowledge entries state
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [adding, setAdding] = useState(false);

  // AI Configuration & Health state
  const [aiStatus, setAiStatus] = useState<AiConfigStatus | null>(null);
  const [loadingAiStatus, setLoadingAiStatus] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  useEffect(() => {
    loadKnowledge();
    loadAiStatus();
  }, []);

  async function loadKnowledge() {
    setLoading(true);
    setError('');
    try {
      const rows = await apiJson<KnowledgeEntry[]>('/ai/knowledge');
      setEntries(rows);
    } catch {
      setError('تعذّر تحميل قاعدة المعرفة. تأكد من تشغيل الخادم.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAiStatus() {
    setLoadingAiStatus(true);
    try {
      const status = await apiJson<AiConfigStatus>('/admin/ai/status');
      setAiStatus(status);
      // Auto run a lightweight connection check if a key is configured
      if (status.configured) {
        runTestPing();
      }
    } catch (err: any) {
      console.error("Failed to load AI status:", err);
    } finally {
      setLoadingAiStatus(false);
    }
  }

  async function runTestPing(keyToTest?: string) {
    setTestingConnection(true);
    try {
      const res = await apiJson<TestConnectionResult>('/admin/ai/test-connection', {
        method: 'POST',
        body: JSON.stringify({ apiKey: keyToTest || undefined }),
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: 'تعذر إجراء فحص الاتصال بالخادم: ' + (err.message || String(err)),
      });
    } finally {
      setTestingConnection(false);
    }
  }

  async function handleSaveApiKey() {
    const key = apiKeyInput.trim();
    if (!key) {
      alert('يرجى كتابة أو لصق مفتاح API أولاً');
      return;
    }

    setSavingKey(true);
    setStatusMessage(null);
    setTestResult(null);

    try {
      const res = await apiJson<{
        success: boolean;
        message: string;
        configured: boolean;
        maskedKey: string;
        source: 'database' | 'env' | 'none';
        testResult?: TestConnectionResult;
      }>('/admin/ai/api-key', {
        method: 'PUT',
        body: JSON.stringify({ apiKey: key }),
      });

      if (res.testResult) {
        setTestResult(res.testResult);
      }

      setAiStatus({
        configured: res.configured,
        maskedKey: res.maskedKey,
        source: res.source,
        provider: 'Google Gemini',
        model: 'gemini-1.5-flash',
        services: {
          chat: res.configured,
          translation: res.configured,
          ragEmbeddings: res.configured,
        },
      });

      setStatusMessage({
        type: res.testResult?.success ? 'success' : 'error',
        text: res.message,
      });

      // Clear plain input after saving for security
      setApiKeyInput('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'حدث خطأ أثناء حفظ المفتاح: ' + (err.message || 'حاول مرة أخرى'),
      });
    } finally {
      setSavingKey(false);
    }
  }

  async function handleRemoveApiKey() {
    if (!confirm('هل أنتِ متأكدة من إزالة مفتاح الـ API من قاعدة البيانات؟ سيتوقف المساعد الذكي والترجمة التلقائية حتى إضافة مفتاح جديد.')) {
      return;
    }

    setSavingKey(true);
    try {
      const res = await apiJson<{
        success: boolean;
        message: string;
        configured: boolean;
        maskedKey: string;
        source: 'database' | 'env' | 'none';
      }>('/admin/ai/api-key', {
        method: 'PUT',
        body: JSON.stringify({ apiKey: '' }),
      });

      setAiStatus({
        configured: res.configured,
        maskedKey: res.maskedKey,
        source: res.source,
        provider: 'Google Gemini',
        model: 'gemini-1.5-flash',
        services: {
          chat: res.configured,
          translation: res.configured,
          ragEmbeddings: res.configured,
        },
      });
      setTestResult(null);
      setStatusMessage({
        type: 'success',
        text: res.message,
      });
      setApiKeyInput('');
    } catch (err: any) {
      alert('حدث خطأ أثناء إزالة المفتاح: ' + err.message);
    } finally {
      setSavingKey(false);
    }
  }

  async function handleAddKnowledge() {
    if (!newTitle.trim() || !newContent.trim()) return;
    setAdding(true);
    try {
      const row = await apiJson<KnowledgeEntry>('/ai/knowledge', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() }),
      });
      setEntries((prev) => [...prev, row]);
      setNewTitle('');
      setNewContent('');
    } catch {
      alert('حدث خطأ أثناء الإضافة إلى قاعدة المعرفة');
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveKnowledge(id: string, title: string, content: string) {
    const row = await apiJson<KnowledgeEntry>(`/ai/knowledge/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    });
    setEntries((prev) => prev.map((e) => (e.id === id ? row : e)));
  }

  async function handleDeleteKnowledge(id: string) {
    await apiJson(`/ai/knowledge/${id}`, { method: 'DELETE' });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const inp = "w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all";
  const inpStyle = {
    background: 'var(--cream)',
    border: '1px solid rgba(127,169,155,0.25)',
    color: 'var(--text-dark)',
  };

  // Derive connection operational state
  const isConfigured = Boolean(aiStatus?.configured);
  const isHealthy = Boolean(testResult?.success);
  const isTesting = testingConnection || loadingAiStatus;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-dark)' }}>
              المساعد الذكي وقاعدة المعرفة
            </h1>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{ background: 'var(--sage-muted)', color: 'var(--sage-dark)' }}
            >
              Google Gemini
            </span>
          </div>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            مراقبة حالة تشغيل الذكاء الاصطناعي الحية، ضبط مفتاح الـ API المشفر، وتغذية قاعدة المعرفة للرد على الأمهات
          </p>
        </div>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--sage-muted) 0%, rgba(127,169,155,0.3) 100%)', color: 'var(--sage-dark)' }}
        >
          <Brain size={26} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 1. AI ENGINE STATUS & API KEY CONTROL CENTER (WIDGET المساعد الحي) */}
      {/* ========================================================================= */}
      <div
        className="rounded-3xl p-6 sm:p-7 space-y-6 relative overflow-hidden transition-all shadow-md"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAF7 100%)',
          border: isHealthy
            ? '1.5px solid rgba(74, 140, 110, 0.35)'
            : !isConfigured
            ? '1.5px solid rgba(234, 179, 8, 0.4)'
            : '1.5px solid rgba(220, 38, 38, 0.3)',
        }}
      >
        {/* Top Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: 'rgba(127,169,155,0.15)' }}>
          <div className="flex items-center gap-3.5">
            {/* Status Pulse Indicator */}
            <div className="relative flex items-center justify-center w-5 h-5">
              {isHealthy ? (
                <>
                  <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600 shadow-sm"></span>
                </>
              ) : isTesting ? (
                <Loader2 size={18} className="animate-spin text-amber-500" />
              ) : !isConfigured ? (
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base" style={{ color: 'var(--text-dark)' }}>
                  {isTesting
                    ? 'جاري فحص الاتصال بمحرك الذكاء الاصطناعي...'
                    : isHealthy
                    ? 'الذكاء الاصطناعي متصل وجاهز للعمل'
                    : !isConfigured
                    ? 'الذكاء الاصطناعي بانتظار إدخال مفتاح API'
                    : 'الذكاء الاصطناعي يواجه مشكلة في الاتصال'}
                </span>

                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{
                    background: isHealthy ? 'rgba(16,185,129,0.12)' : !isConfigured ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                    color: isHealthy ? '#047857' : !isConfigured ? '#B45309' : '#B91C1C',
                  }}
                >
                  {isHealthy ? (
                    <>
                      <CheckCircle2 size={13} />
                      متصل (Online)
                    </>
                  ) : !isConfigured ? (
                    <>
                      <AlertCircle size={13} />
                      غير مهيأ (Unset)
                    </>
                  ) : (
                    <>
                      <XCircle size={13} />
                      معطل (Offline)
                    </>
                  )}
                </span>
              </div>

              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                المزود: Google Gemini 1.5 Flash • المحرك: Google AI Cloud Engine
                {testResult?.latencyMs ? ` • الاستجابة: ${testResult.latencyMs}ms` : ''}
              </p>
            </div>
          </div>

          {/* Test Connection Button */}
          <button
            type="button"
            onClick={() => runTestPing()}
            disabled={isTesting}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 shrink-0 shadow-xs"
            style={{
              background: 'var(--sage-muted)',
              color: 'var(--sage-dark)',
              border: '1px solid rgba(127,169,155,0.3)',
            }}
          >
            {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {isTesting ? 'جاري الفحص...' : 'فحص الاتصال الحي الآن'}
          </button>
        </div>

        {/* Diagnostic Test Feedback Box */}
        {testResult && (
          <div
            className="p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 transition-all"
            style={{
              background: testResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: testResult.success ? '#065F46' : '#991B1B',
            }}
          >
            {testResult.success ? (
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{testResult.message}</p>
              {testResult.latencyMs > 0 && (
                <p className="text-xs opacity-80 mt-0.5">
                  تم اختبار الرد بنجاح في {testResult.latencyMs} مللي ثانية عبر نموذج {testResult.model || 'Gemini 1.5 Flash'}.
                </p>
              )}
              {testResult.error && (
                <p className="text-xs font-mono mt-1 opacity-75 dir-ltr text-left bg-white/60 p-2 rounded-xl">
                  {testResult.error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Status Message */}
        {statusMessage && (
          <div
            className="p-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2"
            style={{
              background: statusMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: statusMessage.type === 'success' ? '#065F46' : '#991B1B',
            }}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* 🔒 Security & Privacy Reassurance Notice */}
        <div
          className="rounded-2xl p-4 transition-all"
          style={{
            background: 'rgba(127,169,155,0.08)',
            border: '1px solid rgba(127,169,155,0.2)',
          }}
        >
          <button
            type="button"
            onClick={() => setShowSecurityDetails(!showSecurityDetails)}
            className="w-full flex items-center justify-between text-right"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--sage-dark)', color: 'white' }}
              >
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-dark)' }}>
                  🔒 هل إدخال مفتاح الـ API هنا آمن ومحمي 100%؟
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  نعم، المفتاح يُحفظ حصرياً داخل قاعدة بيانات السيرفر المشفرة ولا يتم إرساله لأي زائر.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: 'var(--sage-dark)', background: 'var(--sage-muted)' }}>
              {showSecurityDetails ? 'إخفاء التفاصيل' : 'تفاصيل الأمان'}
            </span>
          </button>

          {showSecurityDetails && (
            <div className="mt-3 pt-3 border-t text-xs space-y-2 leading-relaxed" style={{ borderColor: 'rgba(127,169,155,0.15)', color: 'var(--text-body)' }}>
              <p>
                ✓ <strong>حماية على مستوى السيرفر (Server-Side Only):</strong> المفتاح لا يُخزن في المتصفح ولا يظهر في كود الموقع أو شبكة الاتصال للزوار أبداً.
              </p>
              <p>
                ✓ <strong>اتصال سحابي آمن:</strong> جميع محادثات المساعد الذكي وترجمات الموقع تتم كطلبات داخلية من سيرفر رحلة سلام إلى Google API مباشرة عبر بروتوكول HTTPS المشفر.
              </p>
              <p>
                ✓ <strong>صلاحيات حصرية للأدمن:</strong> لا يمكن لأي شخص غير المسؤول المسجل دخوله الوصول إلى صفحة الإعدادات هذه أو قراءة حالة المفتاح.
              </p>
            </div>
          )}
        </div>

        {/* API Key Input & Settings Box */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-dark)' }}>
              <KeyRound size={14} style={{ color: 'var(--sage-dark)' }} />
              مفتاح Google Gemini API
            </label>

            {aiStatus?.maskedKey && (
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: 'var(--text-muted)' }}>المفتاح المسجل حالياً:</span>
                <code
                  className="px-2.5 py-0.5 rounded-lg font-mono font-bold tracking-wider text-xs"
                  style={{ background: 'var(--cream)', color: 'var(--text-dark)', border: '1px solid rgba(127,169,155,0.25)' }}
                >
                  {aiStatus.maskedKey}
                </code>
                <span className="text-emerald-700 bg-emerald-100/70 text-[11px] px-2 py-0.5 rounded-md font-semibold">
                  {aiStatus.source === 'database' ? 'قاعدة البيانات' : 'متغير بيئي'}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                dir="ltr"
                placeholder={aiStatus?.configured ? 'ألصقي مفتاحاً جديداً لتحديث الحالي...' : 'AIzaSy...'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm font-mono outline-none transition-all pr-11"
                style={{
                  background: 'var(--cream)',
                  border: '1px solid rgba(127,169,155,0.3)',
                  color: 'var(--text-dark)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                title={showKey ? 'إخفاء' : 'إظهار'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveApiKey}
              disabled={savingKey || !apiKeyInput.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all disabled:opacity-40 shadow-sm shrink-0"
              style={{ background: 'var(--sage-dark)' }}
            >
              {savingKey ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              حفظ وفحص الاتصال
            </button>

            {/* Clear Key Button */}
            {aiStatus?.source === 'database' && (
              <button
                type="button"
                onClick={handleRemoveApiKey}
                disabled={savingKey}
                className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-200/60 shrink-0"
                title="إزالة المفتاح من قاعدة البيانات"
              >
                <Trash2 size={15} />
                إزالة
              </button>
            )}
          </div>

          {/* External Free Key Link */}
          <div className="flex items-center justify-between text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
            <span>لا تملكين مفتاحاً؟ أو تريدين تجديده مجاناً؟</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="font-bold inline-flex items-center gap-1 hover:underline transition-colors"
              style={{ color: 'var(--sage-dark)' }}
            >
              الحصول على مفتاح مجاني من Google AI Studio
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Active AI Services Cards Matrix */}
        <div className="pt-2">
          <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-dark)' }}>
            الخدمات المدعومة والمفعلة عبر هذا المحرك:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Chatbot */}
            <div
              className="p-4 rounded-2xl space-y-2 border transition-all"
              style={{
                background: isHealthy ? 'rgba(127,169,155,0.06)' : 'var(--cream)',
                borderColor: isHealthy ? 'rgba(127,169,155,0.25)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--sage-muted)', color: 'var(--sage-dark)' }}>
                  <Bot size={17} />
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                  {isHealthy ? 'نشط 🟢' : 'معطل ⚪'}
                </span>
              </div>
              <p className="font-bold text-xs" style={{ color: 'var(--text-dark)' }}>المساعد الذكي للأمهات</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                الرد الفوري والذكي على استفسارات الأمهات على مدار 24 ساعة وفق مبادئ التربية الواعية.
              </p>
            </div>

            {/* 2. Translation */}
            <div
              className="p-4 rounded-2xl space-y-2 border transition-all"
              style={{
                background: isHealthy ? 'rgba(127,169,155,0.06)' : 'var(--cream)',
                borderColor: isHealthy ? 'rgba(127,169,155,0.25)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--sage-muted)', color: 'var(--sage-dark)' }}>
                  <Languages size={17} />
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                  {isHealthy ? 'نشط 🟢' : 'معطل ⚪'}
                </span>
              </div>
              <p className="font-bold text-xs" style={{ color: 'var(--text-dark)' }}>الترجمة والتعريب الفوري</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                ترجمة عناوين وتفاصيل الدورات والمنتجات تلقائياً للغة الإنجليزية بأسلوب احترافي ودافئ.
              </p>
            </div>

            {/* 3. Vector RAG */}
            <div
              className="p-4 rounded-2xl space-y-2 border transition-all"
              style={{
                background: isHealthy ? 'rgba(127,169,155,0.06)' : 'var(--cream)',
                borderColor: isHealthy ? 'rgba(127,169,155,0.25)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--sage-muted)', color: 'var(--sage-dark)' }}>
                  <Cpu size={17} />
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                  {isHealthy ? 'نشط 🟢' : 'معطل ⚪'}
                </span>
              </div>
              <p className="font-bold text-xs" style={{ color: 'var(--text-dark)' }}>البحث الدلالي (Vector RAG)</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                توليد التضمينات الرياضية (Embeddings) والبحث الذكي داخل مقالاتكِ وبيانات الموقع.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📚 2. KNOWLEDGE BASE ENTRIES (قاعدة المعرفة وتدريب المساعد) */}
      {/* ========================================================================= */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>
              قاعدة معرفة وتدريب المساعد
            </h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              المقالات والنصوص التي يرجع إليها الذكاء الاصطناعي لاستخراج الإجابات الدقيقة للأمهات
            </p>
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'var(--sage-muted)', color: 'var(--sage-dark)' }}
          >
            {entries.length} إدخال معرفي
          </span>
        </div>

        {/* Add new entry card */}
        <Card title="إضافة معرفة جديدة" icon={<Sparkles size={18} style={{ color: 'var(--sage-dark)' }} />}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                عنوان الموضوع أو السؤال
              </label>
              <input
                className={inp}
                style={inpStyle}
                placeholder="مثال: أسعار الجلسات الفردية، آلية حجز دورة الأم الهادئة، سياسة الاسترجاع..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                المحتوى والشرح التفصيلي
              </label>
              <textarea
                className={inp}
                style={{ ...inpStyle, minHeight: 110, resize: 'vertical' }}
                placeholder="اكتبي المعلومات والروابط التفصيلية هنا؛ سيقوم الذكاء الاصطناعي بتلخيصها واستخدامها في الإجابة..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddKnowledge}
                disabled={adding || !newTitle.trim() || !newContent.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all disabled:opacity-40 shadow-sm"
                style={{ background: 'var(--sage-dark)' }}
              >
                {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                إضافة إلى قاعدة المعرفة
              </button>
            </div>
          </div>
        </Card>

        {/* Existing entries */}
        <div className="space-y-3 pt-2">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--sage)' }} />
            </div>
          )}

          {error && (
            <div
              className="rounded-2xl p-4 text-sm flex items-center gap-2.5"
              style={{ background: 'rgba(181,82,74,0.08)', color: '#B5524A' }}
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div
              className="rounded-3xl p-8 text-center text-sm space-y-2"
              style={{ background: 'var(--cream)', color: 'var(--text-muted)', border: '1px dashed rgba(127,169,155,0.3)' }}
            >
              <p className="font-semibold text-base" style={{ color: 'var(--text-dark)' }}>لا توجد إدخالات خاصة بعد</p>
              <p className="text-xs">
                يستخدم المساعد حالياً المعلومات الأساسية الافتراضية لمنصة رحلة سلام. يمكنك إضافة موضوعكِ الأول أعلاه لتدريبه على خدمات جديدة!
              </p>
            </div>
          )}

          {!loading && entries.length > 0 && (
            <div className="space-y-2.5">
              {entries.map((e) => (
                <EntryRow key={e.id} entry={e} onSave={handleSaveKnowledge} onDelete={handleDeleteKnowledge} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
