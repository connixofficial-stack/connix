# Spec: Tạo script Python convert ảnh sang WebP và xóa file gốc

## 📋 Tóm tắt

Tạo file `convert_to_webp.py` tại `public/seed_mau/` để:
- Quét đệ quy tất cả ảnh JPG/PNG/... trong 44 thư mục ngành nghề
- Convert sang WebP (quality=85, method=6) với multiprocessing
- **Xóa file gốc** sau khi convert thành công
- Skip nếu `.webp` đã tồn tại

## 🔧 Implementation Steps

### **Bước 1: Tạo file `convert_to_webp.py`**

**Location:** `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\public\seed_mau\convert_to_webp.py`

**Content:**
```python
import os
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
import multiprocessing


def convert_to_webp(args):
    """Convert single image to WebP with best quality/compression ratio."""
    input_path, output_path = args
    
    try:
        with Image.open(input_path) as img:
            # Convert RGBA/P to RGB if no transparency
            if img.mode == 'P':
                img = img.convert('RGBA')
            
            if img.mode == 'RGBA':
                if img.split()[3].getextrema()[0] == 255:
                    img = img.convert('RGB')
            elif img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGB')
            
            # Save with best WebP settings
            img.save(
                output_path,
                format='WEBP',
                quality=85,
                method=6,
                lossless=False,
            )
            
            original_size = os.path.getsize(input_path)
            new_size = os.path.getsize(output_path)
            reduction = (1 - new_size / original_size) * 100
            
            print(f"[OK] {os.path.basename(input_path)} -> {os.path.basename(output_path)} | "
                  f"{original_size//1024}KB -> {new_size//1024}KB ({reduction:.1f}% smaller)")
            return (input_path, True)
            
    except Exception as e:
        print(f"[FAIL] {os.path.basename(input_path)}: {e}")
        return (input_path, False)


def optimize_images_recursive(root_folder):
    """Convert all images in folder tree to WebP and DELETE originals."""
    
    SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif'}
    
    tasks = []
    
    # Walk through all directories recursively
    for dirpath, _, filenames in os.walk(root_folder):
        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower()
            
            if ext in SUPPORTED_FORMATS:
                input_path = os.path.join(dirpath, filename)
                output_filename = os.path.splitext(filename)[0] + '.webp'
                output_path = os.path.join(dirpath, output_filename)
                
                # Skip if WebP already exists
                if os.path.exists(output_path):
                    print(f"[SKIP] {output_filename} already exists")
                    continue
                
                tasks.append((input_path, output_path))
    
    if not tasks:
        print("No images found to convert.")
        return
    
    print(f"Converting {len(tasks)} images to WebP...\n")
    
    # Use multiprocessing for speed
    num_workers = min(multiprocessing.cpu_count(), len(tasks))
    
    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        results = list(executor.map(convert_to_webp, tasks))
    
    # DELETE original files if conversion succeeded
    deleted_count = 0
    for original_path, success in results:
        if success:
            try:
                os.remove(original_path)
                deleted_count += 1
            except Exception as e:
                print(f"[WARN] Could not delete {original_path}: {e}")
    
    success_count = sum(1 for _, s in results if s)
    print(f"\n✅ Done! {success_count}/{len(tasks)} images converted, {deleted_count} originals deleted.")


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    print(f"📂 Scanning directory: {current_dir}\n")
    optimize_images_recursive(current_dir)
```

### **Bước 2: Commit changes**

```bash
git add public/seed_mau/convert_to_webp.py
git commit -m "feat(seed): add WebP conversion script with auto-delete"
```

## ✅ Validation

Sau khi tạo xong, user chạy:
```bash
cd public/seed_mau
python convert_to_webp.py
```

Expected output: Convert ~2800+ ảnh và xóa file gốc.

---

**Total: 1 file mới, 0 file sửa**