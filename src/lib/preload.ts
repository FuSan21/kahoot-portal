/** Warms the browser cache for every question image; never waits longer than `timeoutMs` per image. */
export function preloadImages(urls: string[], onProgress: (done: number, total: number) => void, timeoutMs = 8000) {
  const total = urls.length;
  let done = 0;
  onProgress(0, total);
  if (!total) return Promise.resolve();

  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          const finish = () => {
            window.clearTimeout(timer);
            img.onload = img.onerror = null;
            done += 1;
            onProgress(done, total);
            resolve();
          };
          const timer = window.setTimeout(finish, timeoutMs);
          img.onload = finish;
          img.onerror = finish;
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}
