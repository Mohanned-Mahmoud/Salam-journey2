import { useRef, useState } from 'react';
import { UploadCloud, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { apiJson } from '@/lib/api';

interface R2FileUploaderProps {
  /** The DB record ID (course or product). Can be undefined when adding a new record. */
  entityId?: string;
  /** 'courses' | 'products' — determines which API endpoint to hit */
  entityType: 'courses' | 'products';
  /** Currently saved fileKey (from R2). Used to display the existing file. */
  currentFileKey?: string | null;
  /** Called with the new R2 fileKey after a successful upload */
  onUploaded: (fileKey: string) => void;
  /** Label shown above the uploader */
  label?: string;
  /** Accepted MIME types, e.g. 'video/*' or '.pdf,application/pdf' */
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
      // 1. Get a presigned upload URL from our API
      const { uploadUrl, fileKey } = await apiJson<{ uploadUrl: string; fileKey: string }>(
        `/${entityType}/${entityId}/upload-url`,
        {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        },
      );

      // 2. Upload directly to R2 using XHR so we can track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      setUploadedKey(fileKey);
      setState('done');
      onUploaded(fileKey);
    } catch (err: any) {
      setState('error');
      setErrorMsg(err?.message ?? 'فشل الرفع');
    } finally {
      // Reset the file input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const filename = uploadedKey ? uploadedKey.split('/').pop() : null;

  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
        {label}
      </label>

      {/* Existing / uploaded file pill */}
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

      {/* Drop zone / click area */}
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
              {progress}%
            </span>
          </>
        ) : state === 'error' ? (
          <>
            <XCircle size={22} style={{ color: '#B5524A' }} />
            <span className="text-xs" style={{ color: '#B5524A' }}>{errorMsg}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>اضغط لإعادة المحاولة</span>
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

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
    </div>
  );
}
