/**
 * Đệ quy thu thập tất cả storageId từ config object của snapshot
 */
export function collectSnapshotMediaRefs(config: unknown): string[] {
  const refs: string[] = [];

  function traverse(obj: unknown) {
    if (obj === null || typeof obj !== 'object') {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => traverse(item));
      return;
    }

    const record = obj as Record<string, unknown>;
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        const val = record[key];
        
        // Thu thập các key liên quan đến storageId
        if (key === 'storageId' && typeof val === 'string' && val.trim() !== '') {
          refs.push(val.trim());
        } else if (key.endsWith('StorageId') && typeof val === 'string' && val.trim() !== '') {
          refs.push(val.trim());
        } else if (key === 'storageIds' && Array.isArray(val)) {
          val.forEach(v => {
            if (typeof v === 'string' && v.trim() !== '') {
              refs.push(v.trim());
            }
          });
        } else {
          traverse(val);
        }
      }
    }
  }

  traverse(config);
  
  // Loại trùng và lọc rỗng
  return Array.from(new Set(refs));
}
