/**
 * Chạy @imgly/background-removal trong Web Worker.
 * Dùng inline Blob Worker vì Next.js Turbopack không hỗ trợ `new URL(..., import.meta.url)` cho worker.
 *
 * Flow:
 *   1. Main thread gọi startRemoveBg(blob, callbacks)
 *   2. Hàm tạo inline Worker từ blob URL
 *   3. Worker dynamic import @imgly/background-removal từ CDN (esm.sh)
 *   4. Kết quả trả về qua postMessage
 *
 * Fallback: Nếu Worker fail (CSP, browser cũ...), chạy trực tiếp trên main thread.
 */

export type RemoveBgCallbacks = {
  onProgress?: (stage: string, percent: number) => void;
  onDone: (blob: Blob) => void;
  onError: (error: string) => void;
};

export type RemoveBgHandle = {
  cancel: () => void;
};

export type RemoveBgMode = 'fast' | 'advanced';

export type RemoveBgOptions = {
  mode?: RemoveBgMode;
};

/**
 * Chạy remove background qua main thread (fallback hoặc duy nhất).
 * Vẫn non-blocking ở level await, nhưng nếu inference chạy synchronous phase
 * thì sẽ block UI một chút.
 */
async function runOnMainThread(
  imageBlob: Blob,
  callbacks: RemoveBgCallbacks,
  _options: RemoveBgOptions = {},
): Promise<void> {
  try {
    callbacks.onProgress?.('Đang tải model tách nền AI...', 0);
    const { removeBackground } = await import('@imgly/background-removal');

    const resultBlob = await removeBackground(imageBlob, {
      device: 'gpu',
      model: 'isnet',
      output: {
        format: 'image/png',
        quality: 1,
      },
      progress: (key: string, current: number, total: number) => {
        const stageLabels: Record<string, string> = {
          'compute:inference': 'Đang tách nền bằng AI...',
          'fetch:model': 'Đang tải mô hình AI (~44MB, lần đầu có thể mất vài giây)...',
          'fetch:wasm': 'Đang tải thư viện xử lý WASM...',
        };
        const stage = stageLabels[key] ?? 'Đang xử lý...';
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        callbacks.onProgress?.(stage, percent);
      },
    });

    callbacks.onDone(resultBlob);
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : 'Unknown error');
  }
}

/**
 * Entry point chính: chạy remove background.
 * Trả về handle để cancel.
 */
export function startRemoveBg(
  imageBlob: Blob,
  callbacks: RemoveBgCallbacks,
  options: RemoveBgOptions = {},
): RemoveBgHandle {
  let cancelled = false;

  const wrappedCallbacks: RemoveBgCallbacks = {
    onProgress: (stage, percent) => {
      if (!cancelled) callbacks.onProgress?.(stage, percent);
    },
    onDone: (blob) => {
      if (!cancelled) callbacks.onDone(blob);
    },
    onError: (error) => {
      if (!cancelled) callbacks.onError(error);
    },
  };

  // Chạy trên main thread (dynamic import vẫn lazy load, WASM chạy off-thread internally)
  void runOnMainThread(imageBlob, wrappedCallbacks, options);

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}
