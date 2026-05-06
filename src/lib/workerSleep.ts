/**
 * workerSleep: sleep không bị browser throttle khi tab ẩn.
 * Chrome giới hạn setTimeout >= 1000ms khi tab background,
 * Web Worker timer không bị giới hạn này nên streaming vẫn chạy đúng tốc độ.
 */
const WORKER_BLOB = new Blob(
  [`self.onmessage=function(e){setTimeout(function(){self.postMessage(null)},e.data)}`],
  { type: "application/javascript" }
);

let _blobUrl: string | null = null;
const getBlobUrl = (): string => {
  if (!_blobUrl) _blobUrl = URL.createObjectURL(WORKER_BLOB);
  return _blobUrl;
};

export const workerSleep = (ms: number): Promise<void> => {
  if (typeof Worker === "undefined") {
    // Fallback: SSR / môi trường không có Worker
    return new Promise((r) => setTimeout(r, ms));
  }
  return new Promise((resolve) => {
    const w = new Worker(getBlobUrl());
    w.onmessage = () => { w.terminate(); resolve(); };
    w.postMessage(ms);
  });
};
