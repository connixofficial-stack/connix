# Spec: Bổ sung ảnh seed_mau đầy đủ cho 44 ngành

## 🔍 Phân tích hiện trạng

### Đã có:
- ✅ 44 ngành với cấu trúc thư mục đầy đủ
- ✅ Hero images: 100% (7-35 ảnh/ngành, trung bình 22 ảnh)
- ✅ Scripts tự động: `generate_seed_templates.py` + `convert_to_webp.py`

### Thiếu nghiêm trọng:
- ❌ **Products**: 0/44 ngành (cần 24 ảnh/ngành = 1,056 ảnh)
- ❌ **Posts**: 0/44 ngành (cần 12 ảnh/ngành = 528 ảnh)
- ❌ **Gallery**: 0/44 ngành (cần 16 ảnh/ngành = 704 ảnh)
- ❌ **Logos**: 0/44 ngành (cần 8 ảnh/ngành = 352 ảnh)

**Tổng cần tải: 2,640 ảnh**

---

## 📋 Implementation Plan

### Step 1: Research Free Stock Photo Sources (10 phút)

WebSearch để tìm:
- Unsplash API/bulk download guidelines
- Pexels API access
- Pixabay license terms
- Các nguồn ảnh miễn phí khác (Freepik, Burst by Shopify)

**Criteria**:
- License: Miễn phí thương mại (CC0 hoặc Unsplash License)
- Chất lượng: ≥ 1200px width
- Bulk download: Có API hoặc cho phép tải nhiều

### Step 2: Mapping Keywords cho 44 ngành (30 phút)

Tạo file `scripts/image_keywords.json`:

```json
{
  "fashion": {
    "products": ["fashion clothing", "dress product", "shirt mockup", "pants ecommerce"],
    "posts": ["fashion blog", "style tips", "outfit inspiration"],
    "gallery": ["fashion show", "clothing details", "fabric texture"],
    "logos": ["fashion brand", "minimal logo", "clothing brand identity"]
  },
  "restaurant": {
    "products": ["food dish", "restaurant meal", "cuisine plate"],
    "posts": ["cooking blog", "food photography", "recipe"],
    "gallery": ["restaurant interior", "food preparation", "dining"],
    "logos": ["restaurant logo", "food brand", "culinary brand"]
  }
  // ... 42 ngành khác
}
```

### Step 3: Download Script với API Integration (1 giờ)

Tạo `scripts/download_seed_images.py`:

```python
import requests
import os
from pathlib import Path
import json
import time

UNSPLASH_ACCESS_KEY = "YOUR_KEY"  # Lấy từ unsplash.com/developers
PEXELS_API_KEY = "YOUR_KEY"       # Lấy từ pexels.com/api

def download_unsplash(keyword, count, folder):
    """Download từ Unsplash API"""
    url = f"https://api.unsplash.com/search/photos"
    params = {
        "query": keyword,
        "per_page": count,
        "client_id": UNSPLASH_ACCESS_KEY
    }
    response = requests.get(url, params=params)
    photos = response.json()["results"]
    
    for i, photo in enumerate(photos, 1):
        img_url = photo["urls"]["regular"]  # 1080px width
        img_data = requests.get(img_url).content
        
        filename = f"{folder}/{i}.jpg"
        with open(filename, "wb") as f:
            f.write(img_data)
        
        time.sleep(1)  # Rate limit

def download_pexels(keyword, count, folder):
    """Download từ Pexels API"""
    # Similar implementation
    pass

def main():
    keywords_file = Path("scripts/image_keywords.json")
    keywords = json.loads(keywords_file.read_text())
    
    base_dir = Path("public/seed_mau")
    
    for industry, types in keywords.items():
        print(f"\n📦 Downloading for {industry}...")
        
        for img_type, type_keywords in types.items():
            folder = base_dir / industry / img_type
            folder.mkdir(parents=True, exist_ok=True)
            
            count_needed = {
                "products": 24,
                "posts": 12,
                "gallery": 16,
                "logos": 8
            }[img_type]
            
            for keyword in type_keywords:
                download_unsplash(keyword, count_needed // len(type_keywords), folder)

if __name__ == "__main__":
    main()
```

### Step 4: Alternative - Manual Bulk Download (nếu không dùng API)

Hướng dẫn tải thủ công:
1. Truy cập Unsplash Collections
2. Tạo 44 collections tương ứng 44 ngành
3. Dùng browser extension (Unsplash Downloader) để bulk download
4. Organize vào đúng thư mục

### Step 5: Post-processing (30 phút)

```bash
# 1. Convert sang WebP
python public/seed_mau/convert_to_webp.py

# 2. Resize nếu cần (products nên 1000x1000, posts 1200x800)
# Tạo script resize nếu cần

# 3. Regenerate templates
python scripts/generate_seed_templates.py

# 4. Verify
python scripts/verify_seed_images.py
```

Tạo `scripts/verify_seed_images.py`:

```python
from pathlib import Path

base = Path("public/seed_mau")
industries = [d.name for d in base.iterdir() if d.is_dir()]

required = {
    "hero": 5,
    "products": 24,
    "posts": 12,
    "gallery": 16,
    "logos": 8
}

print("Industry | Hero | Products | Posts | Gallery | Logos | Status")
print("-" * 70)

for industry in sorted(industries):
    counts = {}
    for img_type in required:
        folder = base / industry / img_type
        count = len(list(folder.glob("*.webp")))
        counts[img_type] = count
    
    status = "✅" if all(counts[t] >= required[t] for t in required) else "❌"
    print(f"{industry:20} | {counts['hero']:4} | {counts['products']:8} | {counts['posts']:5} | {counts['gallery']:7} | {counts['logos']:5} | {status}")
```

### Step 6: Commit (5 phút)

```bash
git add public/seed_mau/
git add lib/seed-templates/
git commit -m "feat(seed): add comprehensive product, post, gallery, logo images for 44 industries"
```

---

## 📊 Resources Estimate

- **Thời gian**: 2-4 giờ (tùy API vs manual)
- **Dung lượng**: ~500MB-1GB trước WebP, ~200-400MB sau WebP
- **API limits**:
  - Unsplash: 50 requests/hour (free tier)
  - Pexels: 200 requests/hour

---

## 🎯 Priority Order

1. **Products** (quan trọng nhất - 1,056 ảnh)
2. **Posts** (quan trọng - 528 ảnh)
3. **Gallery** (trung bình - 704 ảnh)
4. **Logos** (thấp nhất, có thể dùng icon/pattern - 352 ảnh)

---

## ⚠️ Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API rate limit | Phân bổ 2-3 ngày download, dùng nhiều nguồn |
| Copyright issues | Chỉ dùng CC0/Unsplash License, ghi nguồn |
| Kích thước file lớn | Compress WebP quality=85, resize trước khi convert |
| Không match ngành | Review keywords kỹ, filter thủ công 10% mẫu |

---

## ✅ Success Criteria

- [ ] 44/44 ngành có đủ products (≥24 ảnh)
- [ ] 44/44 ngành có đủ posts (≥12 ảnh)
- [ ] 44/44 ngành có đủ gallery (≥16 ảnh)
- [ ] 44/44 ngành có đủ logos/patterns (≥8 ảnh)
- [ ] Tất cả ảnh format WebP
- [ ] `generate_seed_templates.py` chạy OK
- [ ] Verify script báo 100% pass