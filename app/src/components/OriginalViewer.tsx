import { useEffect, useRef, useState } from 'react';
import type { OriginalDocument } from '../types';

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

interface Props {
  doc: OriginalDocument;
  title: string;
  onClose: () => void;
  onZoom?: (zoom: number) => void;
}

const resolve = (src: string) => (/^((https?:)?\/|data:|blob:)/.test(src) ? src : `${import.meta.env.BASE_URL}${src}`);

/** Modal viewer for the original (untranslated) document, as a PDF or a saved web page. */
export function OriginalViewer({ doc, title, onClose, onZoom }: Props) {
  const [zoomIdx, setZoomIdx] = useState(ZOOM_STEPS.indexOf(1));
  const zoom = ZOOM_STEPS[zoomIdx];
  const bodyRef = useRef<HTMLDivElement>(null);

  const step = (d: number) => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, Math.max(0, i + d)));

  useEffect(() => onZoom?.(zoom), [zoom, onZoom]);

  // Esc closes; Ctrl/Cmd +/- zooms the document instead of the whole study page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        step(1);
      } else if (e.key === '-') {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Ctrl+wheel / trackpad pinch zooms the document (needs a non-passive listener).
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      acc += e.deltaY;
      if (Math.abs(acc) > 40) {
        step(acc < 0 ? 1 : -1);
        acc = 0;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div className="viewer-backdrop" onClick={onClose}>
      <div className="viewer" role="dialog" aria-modal="true" aria-label="Original document" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-bar">
          <strong>Original document</strong>
          <span className="muted small viewer-title">{title}</span>
          <span className="viewer-zoom">
            <button aria-label="Zoom out" onClick={() => step(-1)} disabled={zoomIdx === 0}>
              −
            </button>
            <button className="zoom-label" onClick={() => setZoomIdx(ZOOM_STEPS.indexOf(1))} title="Reset zoom">
              {Math.round(zoom * 100)}%
            </button>
            <button aria-label="Zoom in" onClick={() => step(1)} disabled={zoomIdx === ZOOM_STEPS.length - 1}>
              +
            </button>
          </span>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="viewer-body" ref={bodyRef}>
          {doc.kind === 'pdf' ? (
            <PdfPages src={resolve(doc.src)} zoom={zoom} />
          ) : doc.kind === 'image' ? (
            <ImagePage src={resolve(doc.src)} zoom={zoom} />
          ) : (
            <HtmlPage src={resolve(doc.src)} zoom={zoom} />
          )}
        </div>
      </div>
    </div>
  );
}

/** At 100% the whole image fits in the viewer (width and height); zoom scales from there. */
function ImagePage({ src, zoom }: { src: string; zoom: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState<number | null>(null); // width / height
  const [fit, setFit] = useState(0);
  useEffect(() => {
    const body = ref.current?.parentElement;
    if (!body || !aspect) return;
    const measure = () =>
      setFit(Math.max(200, Math.min(body.clientWidth - 32, (body.clientHeight - 32) * aspect)));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [aspect]);
  return (
    <div className="image-page" ref={ref}>
      <img
        src={src}
        alt="Original document"
        draggable={false}
        onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        style={fit ? { width: Math.round(fit * zoom), maxWidth: 'none' } : { maxWidth: '100%', visibility: 'hidden' }}
      />
    </div>
  );
}

function HtmlPage({ src, zoom }: { src: string; zoom: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const apply = () => {
    const root = ref.current?.contentDocument?.documentElement;
    if (root) root.style.zoom = String(zoom);
  };
  useEffect(apply, [zoom]);
  return <iframe ref={ref} className="viewer-frame" src={src} title="Original document" onLoad={apply} />;
}

function PdfPages({ src, zoom }: { src: string; zoom: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<import('pdfjs-dist').PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const loaded = await pdfjs.getDocument({ url: src }).promise;
        if (!cancelled) setPdf(loaded);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!pdf || !container.current) return;
    const el = container.current;
    const tasks: { cancel: () => void }[] = [];
    let cancelled = false;
    (async () => {
      const dpr = window.devicePixelRatio || 1;
      const canvases: HTMLCanvasElement[] = [];
      for (let n = 1; n <= pdf.numPages && !cancelled; n++) {
        const page = await pdf.getPage(n);
        const viewport = page.getViewport({ scale: zoom * 1.25 });
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page';
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const task = page.render({
          canvas,
          canvasContext: canvas.getContext('2d')!,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        tasks.push(task);
        try {
          await task.promise;
        } catch {
          return; // cancelled by a newer zoom level
        }
        canvases.push(canvas);
      }
      if (!cancelled) el.replaceChildren(...canvases);
    })();
    return () => {
      cancelled = true;
      tasks.forEach((t) => t.cancel());
    };
  }, [pdf, zoom]);

  if (error) return <p className="muted">Could not load the PDF: {error}</p>;
  return (
    <div className="pdf-pages" ref={container}>
      <p className="muted">Loading…</p>
    </div>
  );
}
