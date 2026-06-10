import type {
  HomepageSnapshotImportReport,
  HomepageSnapshotPayload,
} from './types';

export type ParsedSnapshotMediaFile = {
  logicalPath: string;
  file: File;
};

export type ParsedSnapshotBundle = {
  payload: HomepageSnapshotPayload;
  mediaFiles: ParsedSnapshotMediaFile[];
  fileName: string;
};

const toJsonFile = (value: unknown) => JSON.stringify(value, null, 2);

const splitSnapshotFiles = (payload: HomepageSnapshotPayload) => ({
  'manifest.json': toJsonFile(payload.manifest),
  'homepage/components.json': toJsonFile(payload.homepage.components),
  'homepage/component-order.json': toJsonFile(payload.homepage.componentOrder),
  'homepage/dependencies.json': toJsonFile(payload.homepage.dependencies),
  'homepage/system-style.json': toJsonFile(payload.homepage.systemStyle),
  'homepage/demo-bundle.json': toJsonFile(payload.homepage.demoBundle ?? null),
  'index/media.index.json': toJsonFile(payload.index.mediaIndex),
  'reports/import-preview.json': toJsonFile({
    summary: { blocking: 0, warnings: 0 },
    errors: [],
    warnings: [],
  } satisfies HomepageSnapshotImportReport),
});

const responseToFile = async (url: string, logicalPath: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch media thất bại: ${response.status}`);
  }
  const blob = await response.blob();
  return new File([blob], logicalPath.split('/').pop() || 'file.bin', {
    type: response.headers.get('Content-Type') || blob.type || 'application/octet-stream',
  });
};

const parseJson = async <T>(zip: any, path: string, fallback: T): Promise<T> => {
  const file = zip.file(path);
  if (!file) {
    return fallback;
  }
  const text = await file.async('string');
  return JSON.parse(text) as T;
};

export async function createHomepageSnapshotZip(payload: HomepageSnapshotPayload): Promise<Blob> {
  const JSZipModule = await import('jszip');
  const JSZip = JSZipModule.default;
  const zip = new JSZip();
  const files = splitSnapshotFiles(payload);
  Object.entries(files).forEach(([path, content]) => zip.file(path, content));

  const exportWarnings: Array<{ logicalPath: string; sourceUrl: string; message: string }> = [];
  for (const media of payload.index.mediaIndex) {
    try {
      const file = await responseToFile(media.originalUrl, media.logicalPath);
      zip.file(media.logicalPath, file);
    } catch (error) {
      exportWarnings.push({
        logicalPath: media.logicalPath,
        sourceUrl: media.originalUrl,
        message: error instanceof Error ? error.message : 'Không tải được media',
      });
    }
  }

  zip.file('reports/export-warnings.json', toJsonFile(exportWarnings));
  return zip.generateAsync({ type: 'blob' });
}

export async function parseHomepageSnapshotFile(file: File): Promise<ParsedSnapshotBundle> {
  const JSZipModule = await import('jszip');
  const JSZip = JSZipModule.default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const manifest = await parseJson(zip, 'manifest.json', null as HomepageSnapshotPayload['manifest'] | null);
  const components = await parseJson(zip, 'homepage/components.json', [] as HomepageSnapshotPayload['homepage']['components']);
  const componentOrder = await parseJson(zip, 'homepage/component-order.json', [] as HomepageSnapshotPayload['homepage']['componentOrder']);
  const dependencies = await parseJson(zip, 'homepage/dependencies.json', {
    posts: [],
    products: [],
    services: [],
    productCategories: [],
  } as HomepageSnapshotPayload['homepage']['dependencies']);
  const systemStyle = await parseJson(zip, 'homepage/system-style.json', {
    hiddenTypes: [],
    typeColorOverrides: {},
    typeFontOverrides: {},
    globalFontOverride: { enabled: false, fontKey: 'system-default' },
  } as HomepageSnapshotPayload['homepage']['systemStyle']);
  const demoBundle = await parseJson(zip, 'homepage/demo-bundle.json', null as HomepageSnapshotPayload['homepage']['demoBundle'] | null);
  const mediaIndex = await parseJson(zip, 'index/media.index.json', [] as HomepageSnapshotPayload['index']['mediaIndex']);

  const mediaFiles: ParsedSnapshotMediaFile[] = [];
  for (const media of mediaIndex) {
    const zipFile = zip.file(media.logicalPath);
    if (!zipFile) {
      continue;
    }
    const blob = await zipFile.async('blob');
    mediaFiles.push({
      logicalPath: media.logicalPath,
      file: new File([blob], media.logicalPath.split('/').pop() || 'file.bin', {
        type: media.mimeType || blob.type || 'application/octet-stream',
      }),
    });
  }

  return {
    payload: {
      manifest: manifest!,
      homepage: {
        components,
        componentOrder,
        dependencies,
        systemStyle,
        demoBundle: demoBundle ?? undefined,
      },
      index: { mediaIndex },
    },
    mediaFiles,
    fileName: file.name,
  };
}
