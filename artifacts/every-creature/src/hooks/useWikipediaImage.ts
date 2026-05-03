import { useState, useEffect } from "react";

type ImageState =
  | { status: "loading" }
  | { status: "found"; url: string; pageUrl: string }
  | { status: "not-found" };

const memCache = new Map<string, ImageState>();

function cacheKey(name: string) {
  return `wiki-img:${name.toLowerCase()}`;
}

function readSession(name: string): ImageState | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(name));
    if (!raw) return null;
    return JSON.parse(raw) as ImageState;
  } catch {
    return null;
  }
}

function writeSession(name: string, state: ImageState) {
  try {
    sessionStorage.setItem(cacheKey(name), JSON.stringify(state));
  } catch {
  }
}

export function useWikipediaImage(creatureName: string): ImageState {
  const cached = memCache.get(cacheKey(creatureName));
  const [state, setState] = useState<ImageState>(
    cached ?? readSession(creatureName) ?? { status: "loading" }
  );

  useEffect(() => {
    const key = cacheKey(creatureName);

    if (memCache.has(key)) {
      setState(memCache.get(key)!);
      return;
    }

    const session = readSession(creatureName);
    if (session) {
      memCache.set(key, session);
      setState(session);
      return;
    }

    let cancelled = false;

    async function fetchImage() {
      const encoded = encodeURIComponent(creatureName.replace(/ /g, "_"));
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("not-found");
        const data = await res.json();
        const src: string | undefined = data?.thumbnail?.source;
        const pageUrl: string = data?.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encoded}`;
        const result: ImageState = src
          ? { status: "found", url: src, pageUrl }
          : { status: "not-found" };
        if (!cancelled) {
          memCache.set(key, result);
          writeSession(creatureName, result);
          setState(result);
        }
      } catch {
        const result: ImageState = { status: "not-found" };
        if (!cancelled) {
          memCache.set(key, result);
          writeSession(creatureName, result);
          setState(result);
        }
      }
    }

    fetchImage();
    return () => {
      cancelled = true;
    };
  }, [creatureName]);

  return state;
}
