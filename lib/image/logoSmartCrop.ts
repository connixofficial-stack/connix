export type SmartLogoCropProgress = {
  percent: number;
  stage: string;
};

export type SmartLogoCropOptions = {
  onProgress?: (progress: SmartLogoCropProgress) => void;
  useModelFallback?: boolean;
};

type SubjectBox = {
  bottom: number;
  confidence: number;
  left: number;
  right: number;
  source: 'alpha' | 'background';
  top: number;
};

export type SmartLogoCropBox = Pick<SubjectBox, 'bottom' | 'left' | 'right' | 'top'>;

type LoadedImage = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  height: number;
  image: HTMLImageElement;
  width: number;
};

const ALPHA_THRESHOLD = 12;
const BACKGROUND_DISTANCE_THRESHOLD = 34;
const MIN_SUBJECT_PIXELS_RATIO = 0.002;

function emitProgress(options: SmartLogoCropOptions, stage: string, percent: number) {
  options.onProgress?.({ percent: Math.min(100, Math.max(0, Math.round(percent))), stage });
}

function loadImageFromBlob(blob: Blob): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const url = URL.createObjectURL(blob);

    image.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Không thể khởi tạo canvas để xử lý logo'));
        return;
      }
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);
      resolve({ canvas, ctx, height: image.naturalHeight, image, width: image.naturalWidth });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể đọc ảnh logo'));
    };

    image.src = url;
  });
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function averageCornerColor(data: Uint8ClampedArray, width: number, height: number): [number, number, number] {
  const sample = Math.max(4, Math.min(24, Math.floor(Math.min(width, height) * 0.08)));
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  const corners = [
    [0, 0],
    [width - sample, 0],
    [0, height - sample],
    [width - sample, height - sample],
  ] as const;

  for (const [startX, startY] of corners) {
    for (let y = Math.max(0, startY); y < Math.min(height, startY + sample); y += 1) {
      for (let x = Math.max(0, startX); x < Math.min(width, startX + sample); x += 1) {
        const i = (y * width + x) * 4;
        if (data[i + 3] < ALPHA_THRESHOLD) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count += 1;
      }
    }
  }

  if (count === 0) return [255, 255, 255];
  return [r / count, g / count, b / count];
}

function findBoxByAlpha(data: Uint8ClampedArray, width: number, height: number): SubjectBox | null {
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  let opaquePixels = 0;
  let transparentPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 245) transparentPixels += 1;
      if (alpha <= ALPHA_THRESHOLD) continue;
      opaquePixels += 1;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }

  const totalPixels = width * height;
  if (right < left || opaquePixels / totalPixels < MIN_SUBJECT_PIXELS_RATIO) return null;
  if (transparentPixels / totalPixels < 0.01) return null;

  const boxAreaRatio = ((right - left + 1) * (bottom - top + 1)) / totalPixels;
  return {
    bottom,
    confidence: boxAreaRatio > 0.98 ? 0.45 : 0.95,
    left,
    right,
    source: 'alpha',
    top,
  };
}

function findBoxByBackground(data: Uint8ClampedArray, width: number, height: number): SubjectBox | null {
  const background = averageCornerColor(data, width, height);
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  let subjectPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (data[i + 3] <= ALPHA_THRESHOLD) continue;
      const distance = colorDistance([data[i], data[i + 1], data[i + 2]], background);
      if (distance <= BACKGROUND_DISTANCE_THRESHOLD) continue;
      subjectPixels += 1;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }

  const totalPixels = width * height;
  if (right < left || subjectPixels / totalPixels < MIN_SUBJECT_PIXELS_RATIO) return null;

  const boxAreaRatio = ((right - left + 1) * (bottom - top + 1)) / totalPixels;
  const isTouchingLeftAndRight = left === 0 && right === width - 1;
  const isLargeBox = boxAreaRatio > 0.6;
  
  let confidence = boxAreaRatio > 0.96 ? 0.35 : 0.78;
  if (isLargeBox && isTouchingLeftAndRight) {
    confidence = 0.5;
  }

  return {
    bottom,
    confidence,
    left,
    right,
    source: 'background',
    top,
  };
}

function findSubjectBox(canvas: HTMLCanvasElement): SubjectBox | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return findBoxByAlpha(data, canvas.width, canvas.height) ?? findBoxByBackground(data, canvas.width, canvas.height);
}

async function removeBackgroundWithModel(file: File, options: SmartLogoCropOptions): Promise<File | null> {
  try {
    emitProgress(options, 'Đang tải model nhận diện chủ thể...', 25);
    const { removeBackground } = await import('@imgly/background-removal');
    const blob = await removeBackground(file, {
      device: 'gpu',
      model: 'isnet',
      output: {
        format: 'image/png',
        quality: 1,
      },
      progress: (key: string, current: number, total: number) => {
        const labels: Record<string, string> = {
          'compute:inference': 'Đang nhận diện chủ thể ảnh...',
          'fetch:model': 'Đang tải model...',
          'fetch:wasm': 'Đang tải WASM...',
        };
        const basePercent = key === 'compute:inference' ? 45 : 25;
        const range = key === 'compute:inference' ? 35 : 20;
        const ratio = total > 0 ? current / total : 0;
        emitProgress(options, labels[key] ?? 'Đang xử lý model...', basePercent + ratio * range);
      },
    });
    return new File([blob], file.name.replace(/\.[^/.]+$/, '-model.png'), { type: 'image/png' });
  } catch (error) {
    console.error('[SmartLogoCrop] Model fallback failed:', error);
    return null;
  }
}

async function renderTightLogo(source: LoadedImage, box: SubjectBox, originalName: string): Promise<File> {
  const subjectWidth = box.right - box.left + 1;
  const subjectHeight = box.bottom - box.top + 1;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể tạo canvas logo đã căn');

  canvas.width = Math.max(1, subjectWidth);
  canvas.height = Math.max(1, subjectHeight);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source.canvas, box.left, box.top, subjectWidth, subjectHeight, 0, 0, subjectWidth, subjectHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Không thể tạo ảnh logo đã căn'));
        return;
      }
      const baseName = originalName.replace(/\.[^/.]+$/, '');
      resolve(new File([blob], `${baseName}-auto-crop.png`, { type: 'image/png' }));
    }, 'image/png', 1);
  });
}

export async function detectSmartLogoCropBox(
  file: File,
  options: SmartLogoCropOptions = {},
): Promise<SmartLogoCropBox | null> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return null;

  emitProgress(options, 'Đang đọc ảnh...', 5);
  let source = await loadImageFromBlob(file);
  emitProgress(options, 'Đang tìm chủ thể ảnh...', 15);
  let box = findSubjectBox(source.canvas);

  if ((!box || box.confidence < 0.72) && options.useModelFallback !== false) {
    const modelFile = await removeBackgroundWithModel(file, options);
    if (modelFile) {
      source = await loadImageFromBlob(modelFile);
      box = findSubjectBox(source.canvas) ?? box;
    }
  }

  if (!box) {
    emitProgress(options, 'Không tìm thấy vùng auto crop...', 100);
    return null;
  }

  emitProgress(options, `Đã tìm thấy vùng crop sát (${box.source})`, 100);
  return {
    bottom: box.bottom,
    left: box.left,
    right: box.right,
    top: box.top,
  };
}

export async function smartCropLogoFile(
  file: File,
  options: SmartLogoCropOptions = {},
): Promise<File> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  emitProgress(options, 'Đang đọc ảnh...', 5);
  let source = await loadImageFromBlob(file);
  emitProgress(options, 'Đang tìm chủ thể ảnh...', 15);
  let box = findSubjectBox(source.canvas);

  if ((!box || box.confidence < 0.72) && options.useModelFallback !== false) {
    const modelFile = await removeBackgroundWithModel(file, options);
    if (modelFile) {
      source = await loadImageFromBlob(modelFile);
      box = findSubjectBox(source.canvas) ?? box;
    }
  }

  if (!box) {
    emitProgress(options, 'Không tìm thấy vùng cần cắt, giữ ảnh gốc...', 100);
    return file;
  }

  emitProgress(options, `Đang crop sát chủ thể (${box.source})...`, 88);
  const result = await renderTightLogo(source, box, file.name);
  emitProgress(options, 'Hoàn tất auto crop ảnh', 100);
  return result;
}
