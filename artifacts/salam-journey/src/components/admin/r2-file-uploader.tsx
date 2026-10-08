import { useRef, useState } from 'react';
import { UploadCloud, CheckCircle, XCircle, Loader2, X } from 'lucide-react';

interface R2FileUploaderProps {
  entityId?: string;
  entityType: 'courses' | 'products';
  currentFileKey?: string | null;
  onUploaded: (fileKey: string) => void;
  label?: string;
  accept?: string;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export function R2FileUploader({
  entityId,
  entityType,
  currentFileKey,
  onUploaded,
  label = 'رفع ملف',
  accept = '*/*',
}: R2FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedKey, setUploadedKey] = useState<string | null>(currentFileKey ?? null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !entityId) return;

    setState('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      // Upload via our own API server (avoids CORS with R2 directly)
      const formData = new FormData();
      formData.append('file', file);

      const result = await new Promise<{ fileKey: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/upload/${entityType}/${entityId}`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { reject(new Error('Invalid server response')); }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error ?? `HTTP ${xhr.status}`));
            } catch {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      setUploadedKey(result.fileKey);
      setState('done');
      onUploaded(result.fileKey);
    } catch (err: any) {
      setState('error');
      setErrorMsg(err?.message ?? 'فشل الرفع');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const filename = uploadedKey ? uploadedKey.split('/').pop() : null;

  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
        {label}
      </label>

      {uploadedKey && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2 text-xs font-medium"
          style={{ background: 'rgba(90,138,128,0.1)', color: 'var(--sage-dark)', border: '1px solid rgba(90,138,128,0.2)' }}
        >
          <CheckCircle size={13} />
          <span className="truncate flex-1" title={uploadedKey}>{filename}</span>
          <button
            type="button"
            title="إزالة"
            onClick={() => { setUploadedKey(null); setState('idle'); onUploaded(''); }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={state === 'uploading'}
        className="w-full flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed transition-all disabled:opacity-50"
        style={{ borderColor: 'rgba(127,169,155,0.4)', background: 'var(--cream)' }}
      >
        {state === 'uploading' ? (
          <>
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--sage)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              جاري الرفع… {progress}%
            </span>
          </>
        ) : state === 'error' ? (
          <>
            <XCircle size={22} style={{ color: '#B5524A' }} />
            <span className="text-xs" style={{ color: '#B5524A' }}>{errorMsg}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>اضغط للمحاولة مرة أخرى</span>
          </>
        ) : (
          <>
            <UploadCloud size={22} style={{ color: 'var(--sage)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {uploadedKey ? 'استبدال الملف' : 'اضغط لاختيار ملف'}
            </span>
          </>
        )}
      </button>

      {/* Progress bar */}
      {state === 'uploading' && (
        <div className="mt-2 rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(127,169,155,0.2)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: 'var(--sage)' }}
          />
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
    </div>
  );
}
