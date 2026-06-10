import type { BundleImportReport, MigrationBundlePayload } from './types';

export type ParsedMediaFile = {
  logicalPath: string;
  file: File;
};

export type ParsedBundleInput = {
  payload: MigrationBundlePayload;
  mediaFiles: ParsedMediaFile[];
  fileName: string;
};

const textEncoder = new TextEncoder();

const toJsonFile = (value: unknown) => JSON.stringify(value, null, 2);

const splitModuleFiles = (payload: MigrationBundlePayload) => {
  const files: Record<string, string> = {
    'manifest.json': toJsonFile(payload.manifest),
    'README.agent.json': toJsonFile(payload.readmeAgent),
    'index/modules.json': toJsonFile(payload.index.modules),
    'index/dependencies.json': toJsonFile(payload.index.dependencies),
    'index/media.index.json': toJsonFile(payload.index.mediaIndex),
    'reports/import-preview.json': toJsonFile({
      summary: {
        blocking: 0,
        warnings: 0,
        modulesAffected: payload.manifest.selectedModules,
      },
      errors: [],
      warnings: [],
    } satisfies BundleImportReport),
  };

  Object.entries(payload.index.records).forEach(([module, records]) => {
    files[`index/records/${module}.index.json`] = toJsonFile(records);
  });

  if (payload.modules.settings) {
    const data = payload.modules.settings as Record<string, unknown>;
    files['modules/settings/settings.json'] = toJsonFile(data.settings ?? []);
    files['modules/settings/module-settings.json'] = toJsonFile(data.moduleSettings ?? []);
    files['modules/settings/module-features.json'] = toJsonFile(data.moduleFeatures ?? []);
    files['modules/settings/module-fields.json'] = toJsonFile(data.moduleFields ?? []);
  }

  if (payload.modules.products) {
    const data = payload.modules.products as Record<string, unknown>;
    files['modules/products/categories.json'] = toJsonFile(data.categories ?? []);
    files['modules/products/products.chunk-001.json'] = toJsonFile(data.products ?? []);
    files['modules/products/options.json'] = toJsonFile(data.options ?? []);
    files['modules/products/option-values.json'] = toJsonFile(data.optionValues ?? []);
    files['modules/products/variants.chunk-001.json'] = toJsonFile(data.variants ?? []);
    files['modules/products/supplemental-contents.json'] = toJsonFile(data.supplementalContents ?? []);
  }

  if (payload.modules.services) {
    const data = payload.modules.services as Record<string, unknown>;
    files['modules/services/categories.json'] = toJsonFile(data.categories ?? []);
    files['modules/services/services.chunk-001.json'] = toJsonFile(data.services ?? []);
  }

  if (payload.modules.posts) {
    const data = payload.modules.posts as Record<string, unknown>;
    files['modules/posts/categories.json'] = toJsonFile(data.categories ?? []);
    files['modules/posts/posts.chunk-001.json'] = toJsonFile(data.posts ?? []);
  }

  if (payload.modules.menus) {
    const data = payload.modules.menus as Record<string, unknown>;
    files['modules/menus/menus.json'] = toJsonFile(data.menus ?? []);
    files['modules/menus/menu-items.chunk-001.json'] = toJsonFile(data.menuItems ?? []);
  }

  if (payload.modules['home-components']) {
    const data = payload.modules['home-components'] as Record<string, unknown>;
    files['modules/home-components/components.chunk-001.json'] = toJsonFile(data.components ?? []);
    files['modules/home-components/component-order.json'] = toJsonFile(data.componentOrder ?? []);
  }

  return files;
};

const responseToFile = async (url: string, logicalPath: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch media thất bại: ${response.status}`);
  }
  const contentType = response.headers.get('Content-Type') || undefined;
  const blob = await response.blob();
  const name = logicalPath.split('/').pop() || 'file.bin';
  const fileType = contentType || blob.type || 'application/octet-stream';
  return new File([blob], name, { type: fileType });
};

export async function createZipFromPayload(payload: MigrationBundlePayload): Promise<Blob> {
  const JSZipModule = await import('jszip');
  const JSZip = JSZipModule.default;
  const zip = new JSZip();
  const files = splitModuleFiles(payload);
  Object.entries(files).forEach(([path, content]) => zip.file(path, content));

  const exportWarnings: Array<{ logicalPath?: string; message: string; sourceUrl?: string }> = [];
  for (const media of payload.index.mediaIndex) {
    try {
      const file = await responseToFile(media.originalUrl, media.logicalPath);
      zip.file(media.logicalPath, file);
    } catch (error) {
      exportWarnings.push({
        logicalPath: media.logicalPath,
        message: error instanceof Error ? error.message : 'Không tải được media',
        sourceUrl: media.originalUrl,
      });
    }
  }

  zip.file('reports/export-warnings.json', toJsonFile(exportWarnings));
  return zip.generateAsync({ type: 'blob' });
}

const parseJson = async <T>(zip: any, path: string, fallback: T): Promise<T> => {
  const file = zip.file(path);
  if (!file) {
    return fallback;
  }
  const text = await file.async('string');
  return JSON.parse(text) as T;
};

export async function parseBundleFile(file: File): Promise<ParsedBundleInput> {
  if (file.name.toLowerCase().endsWith('.json')) {
    const text = await file.text();
    return {
      payload: JSON.parse(text) as MigrationBundlePayload,
      mediaFiles: [],
      fileName: file.name,
    };
  }

  const JSZipModule = await import('jszip');
  const JSZip = JSZipModule.default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const manifest = await parseJson(zip, 'manifest.json', null as MigrationBundlePayload['manifest'] | null);
  const readmeAgent = await parseJson(zip, 'README.agent.json', null as MigrationBundlePayload['readmeAgent'] | null);
  const modules = await parseJson(zip, 'index/modules.json', [] as MigrationBundlePayload['manifest']['selectedModules']);
  const dependencies = await parseJson(zip, 'index/dependencies.json', {} as MigrationBundlePayload['index']['dependencies']);
  const mediaIndex = await parseJson(zip, 'index/media.index.json', [] as MigrationBundlePayload['index']['mediaIndex']);

  const records: MigrationBundlePayload['index']['records'] = {};
  for (const moduleKey of modules) {
    records[moduleKey] = await parseJson(zip, `index/records/${moduleKey}.index.json`, []);
  }

  const payload: MigrationBundlePayload = {
    manifest: manifest!,
    readmeAgent: readmeAgent!,
    index: {
      modules,
      dependencies,
      mediaIndex,
      records,
    },
    modules: {},
  };

  if (modules.includes('settings')) {
    payload.modules.settings = {
      settings: await parseJson(zip, 'modules/settings/settings.json', []),
      moduleSettings: await parseJson(zip, 'modules/settings/module-settings.json', []),
      moduleFeatures: await parseJson(zip, 'modules/settings/module-features.json', []),
      moduleFields: await parseJson(zip, 'modules/settings/module-fields.json', []),
    };
  }

  if (modules.includes('products')) {
    payload.modules.products = {
      categories: await parseJson(zip, 'modules/products/categories.json', []),
      products: await parseJson(zip, 'modules/products/products.chunk-001.json', []),
      options: await parseJson(zip, 'modules/products/options.json', []),
      optionValues: await parseJson(zip, 'modules/products/option-values.json', []),
      variants: await parseJson(zip, 'modules/products/variants.chunk-001.json', []),
      supplementalContents: await parseJson(zip, 'modules/products/supplemental-contents.json', []),
    };
  }

  if (modules.includes('services')) {
    payload.modules.services = {
      categories: await parseJson(zip, 'modules/services/categories.json', []),
      services: await parseJson(zip, 'modules/services/services.chunk-001.json', []),
    };
  }

  if (modules.includes('posts')) {
    payload.modules.posts = {
      categories: await parseJson(zip, 'modules/posts/categories.json', []),
      posts: await parseJson(zip, 'modules/posts/posts.chunk-001.json', []),
    };
  }

  if (modules.includes('menus')) {
    payload.modules.menus = {
      menus: await parseJson(zip, 'modules/menus/menus.json', []),
      menuItems: await parseJson(zip, 'modules/menus/menu-items.chunk-001.json', []),
    };
  }

  if (modules.includes('home-components')) {
    payload.modules['home-components'] = {
      components: await parseJson(zip, 'modules/home-components/components.chunk-001.json', []),
      componentOrder: await parseJson(zip, 'modules/home-components/component-order.json', []),
    };
  }

  const mediaFiles: ParsedMediaFile[] = [];
  for (const media of mediaIndex) {
    const zipFile = zip.file(media.logicalPath);
    if (!zipFile) {
      continue;
    }
    const blob = await zipFile.async('blob');
    const fileType = media.mimeType || blob.type || 'application/octet-stream';
    mediaFiles.push({
      logicalPath: media.logicalPath,
      file: new File([blob], media.logicalPath.split('/').pop() || 'file.bin', { type: fileType }),
    });
  }

  return {
    payload,
    mediaFiles,
    fileName: file.name,
  };
}

export async function checksumText(content: string): Promise<string> {
  const buffer = textEncoder.encode(content);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
