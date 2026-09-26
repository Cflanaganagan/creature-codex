import { useState, useEffect } from "react";

type FoundImage = { status: "found"; url: string; originalUrl?: string; pageUrl: string };
type ImageState = { status: "loading" } | FoundImage | { status: "not-found" };
const memCache = new Map<string, FoundImage>();
const pending = new Map<string, Promise<ImageState>>();
const queue: Array<() => void> = [];
let running = 0;
const aliases: Record<string, string> = {
  "tyrannosaurus rex": "Tyrannosaurus",
  "stellers sea cow": "Steller's sea cow",
  "terror bird": "Phorusrhacidae",
  "giant ground sloth": "Megatherium",
  "cambrian anomalocaris": "Anomalocaris",
};
const keyFor = (name: string, genus: string) => `wiki-img:v3:${name.toLowerCase()}:${genus.toLowerCase()}`;

function readCache(key: string): FoundImage | undefined {
  if (memCache.has(key)) return memCache.get(key);
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "null");
    if (value?.status === "found" && typeof value.url === "string" && typeof value.pageUrl === "string") {
      memCache.set(key, value); return value;
    }
  } catch { /* A blocked or full cache must not prevent image loading. */ }
  return undefined;
}

async function limited<T>(task: () => Promise<T>): Promise<T> {
  // Transfer an occupied slot directly to the next waiter, keeping the cap at four.
  if (running >= 4) await new Promise<void>(resolve => queue.push(resolve));
  else running++;
  try { return await task(); }
  finally { const next = queue.shift(); if (next) next(); else running--; }
}

async function summary(title: string): Promise<FoundImage | undefined> {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
        headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000),
      });
      if (response.status === 404) return;
      if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
      const data = await response.json();
      if (data.type === "disambiguation") return;
      const url = data.thumbnail?.source || data.originalimage?.source;
      if (!url) return;
      return { status: "found", url, originalUrl: data.originalimage?.source, pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}` };
    } catch {
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  return undefined;
}

// This article has illustrations but no summary thumbnail. Use a verified
// specimen photograph from the article rather than an unrelated genus image.
async function articleImageFallback(name: string): Promise<FoundImage | undefined> {
  if (name.toLowerCase() !== "liopleurodon") return undefined;
  try {
    const params = new URLSearchParams({ action: "query", titles: "File:Liopleurodon ferox Tubingen 2.JPG", prop: "imageinfo", iiprop: "url", iiurlwidth: "640", format: "json", origin: "*" });
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return undefined;
    const data = await response.json();
    const pages = Object.values(data.query?.pages || {}) as Array<{ imageinfo?: Array<{ thumburl?: string; url?: string; descriptionurl?: string }> }>;
    const info = pages[0]?.imageinfo?.[0];
    if (info?.url && info.descriptionurl) return { status: "found", url: info.thumburl || info.url, originalUrl: info.url, pageUrl: info.descriptionurl };
  } catch { /* Retry naturally on the next visit, rather than caching a failure. */ }
  return undefined;
}

function loadImage(name: string, genus: string, key: string): Promise<ImageState> {
  const existing = pending.get(key);
  if (existing) return existing;
  const task = limited(async (): Promise<ImageState> => {
    const sentenceCase = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const candidates = [...new Set([aliases[name.toLowerCase()], name, sentenceCase, genus].filter((x): x is string => Boolean(x) && x !== "Unknown"))];
    for (const candidate of candidates) {
      const image = await summary(candidate);
      if (image) {
        memCache.set(key, image);
        try { sessionStorage.setItem(key, JSON.stringify(image)); } catch { /* optional cache */ }
        return image;
      }
    }
    const fallback = await articleImageFallback(name);
    if (fallback) {
      memCache.set(key, fallback);
      try { sessionStorage.setItem(key, JSON.stringify(fallback)); } catch { /* optional cache */ }
      return fallback;
    }
    // Never persist a network error or missing image for the entire session.
    return { status: "not-found" };
  });
  pending.set(key, task);
  void task.finally(() => pending.delete(key));
  return task;
}

export function useWikipediaImage(creatureName: string, genus = ""): ImageState {
  const key = keyFor(creatureName, genus);
  const [result, setResult] = useState<{ key: string; image: ImageState }>(() => ({ key, image: readCache(key) || { status: "loading" } }));
  useEffect(() => {
    let cancelled = false;
    const cached = readCache(key);
    if (cached) { setResult({ key, image: cached }); return; }
    setResult({ key, image: { status: "loading" } });
    const load = () => { void loadImage(creatureName, genus, key).then(image => { if (!cancelled) setResult({ key, image }); }); };
    load();
    window.addEventListener("online", load);
    return () => { cancelled = true; window.removeEventListener("online", load); };
  }, [key, creatureName, genus]);
  return result.key === key ? result.image : readCache(key) || { status: "loading" };
}
