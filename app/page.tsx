"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AdItem {
  id: number;
  url: string;
  originalName: string | null;
  uploadedAt: number;
}

const SCROLL_KEY = "shittyads_scroll";
const SECRET_KEY = "shittyads_secret";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSecret, setUploadSecret] = useState("");
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const scrollRestoredRef = useRef(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SECRET_KEY);
    if (stored) setUploadSecret(stored);
  }, []);

  const fetchAds = useCallback(async (cursor?: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const url = cursor ? `/api/ads?cursor=${cursor}` : "/api/ads";
      const res = await fetch(url);
      const data = await res.json();
      setAds((prev) => (cursor ? [...prev, ...data.items] : data.items));
      setNextCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ads.length > 0 && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      const saved = localStorage.getItem(SCROLL_KEY);
      if (saved) {
        requestAnimationFrame(() =>
          window.scrollTo({ top: Number(saved), behavior: "instant" })
        );
      }
    }
  }, [ads]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          localStorage.setItem(SCROLL_KEY, String(window.scrollY));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          setNextCursor((cursor) => {
            if (cursor !== null) fetchAds(cursor);
            return cursor;
          });
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchAds]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleUpload(files: FileList | File[]) {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of arr) fd.append("files", f);
      const headers: Record<string, string> = {};
      if (uploadSecret) headers["x-upload-secret"] = uploadSecret;
      const res = await fetch("/api/upload", { method: "POST", headers, body: fd });
      if (!res.ok) {
        const err = await res.json();
        alert(`Upload fehlgeschlagen: ${err.error}`);
        return;
      }
      scrollRestoredRef.current = true;
      await fetchAds();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleUpload(e.target.files);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleUpload(e.dataTransfer.files);
  }

  function saveSecret(val: string) {
    setUploadSecret(val);
    localStorage.setItem(SECRET_KEY, val);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">💩 ShittyAds</h1>
        <p className="text-gray-400 text-sm">
          Eine Sammlung von Scam- und Trash-Werbung aus dem Internet
        </p>
      </header>

      {/* Upload area */}
      <div
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer select-none ${
          dragOver
            ? "border-orange-400 bg-orange-400/10"
            : "border-gray-600 hover:border-gray-400"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
        {uploading ? (
          <span className="text-orange-400 animate-pulse text-lg">Lädt hoch…</span>
        ) : (
          <>
            <p className="text-gray-300 font-medium text-lg">
              Screenshot hier hinziehen oder klicken
            </p>
            <p className="text-gray-500 text-sm mt-1">
              JPG · PNG · GIF · WEBP · max. 20 MB · mehrere Dateien möglich
            </p>
          </>
        )}
      </div>

      {/* Secret config */}
      <div className="mb-8 text-right">
        <button
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          onClick={() => setShowSecretInput((v) => !v)}
        >
          ⚙ Upload-Secret {showSecretInput ? "▲" : "▼"}
        </button>
        {showSecretInput && (
          <div className="mt-2 flex gap-2 justify-end">
            <input
              type="password"
              placeholder="Secret (leer = kein Schutz)"
              value={uploadSecret}
              onChange={(e) => saveSecret(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white w-72 focus:outline-none focus:border-orange-400"
            />
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="flex flex-col gap-8">
        {ads.map((ad) => (
          <article key={ad.id}>
            <img
              src={ad.url}
              alt={ad.originalName ?? "Ad"}
              className="w-full rounded-lg cursor-zoom-in object-contain max-h-[85vh] bg-gray-900"
              loading="lazy"
              onClick={() => setLightbox(ad.url)}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500 px-1">
              <span className="truncate max-w-[60%]">
                {ad.originalName ?? "—"}
              </span>
              <span className="shrink-0">{formatDate(ad.uploadedAt)}</span>
            </div>
          </article>
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <p className="text-center text-gray-500 py-8 animate-pulse">Lädt…</p>
      )}
      {!hasMore && ads.length > 0 && (
        <p className="text-center text-gray-600 py-8 text-sm">
          Das war alles. Mehr Schrott bitte hochladen. 🗑️
        </p>
      )}
      {!loading && ads.length === 0 && (
        <p className="text-center text-gray-500 py-16">
          Noch keine Ads hochgeladen.
        </p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Vollbild"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
