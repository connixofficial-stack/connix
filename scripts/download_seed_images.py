from __future__ import annotations

from pathlib import Path
import json
import time
import urllib.parse
import urllib.request


TYPE_COUNTS = {
    "products": 24,
    "posts": 12,
    "gallery": 16,
    "logos": 8,
}

TYPE_SIZES = {
    "products": (1000, 1000),
    "posts": (1200, 800),
    "gallery": (1200, 900),
    "logos": (600, 300),
}

TYPE_PREFIX = {
    "products": "product",
    "posts": "post",
    "gallery": "gallery",
    "logos": "logo",
}


def load_keywords(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def count_existing(folder: Path) -> int:
    if not folder.exists():
        return 0
    return len(
        [f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in {".webp", ".jpg", ".jpeg"}]
    )


def build_url(keyword: str, size: tuple[int, int], sig: int) -> str:
    query = urllib.parse.quote(keyword)
    width, height = size
    return f"https://loremflickr.com/{width}/{height}/{query}?lock={sig}"


def download_image(url: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        },
    )
    with urllib.request.urlopen(request) as response:  # noqa: S310
        data = response.read()
    output.write_bytes(data)


def download_type(industry_key: str, type_key: str, keywords: list[str], base_dir: Path) -> None:
    target_dir = base_dir / industry_key / type_key
    required = TYPE_COUNTS[type_key]
    existing = count_existing(target_dir)
    if existing >= required:
        print(f"{industry_key}/{type_key}: đủ {existing}/{required}, bỏ qua")
        return

    size = TYPE_SIZES[type_key]
    prefix = TYPE_PREFIX[type_key]
    remaining = required - existing
    print(f"{industry_key}/{type_key}: cần tải {remaining} ảnh")

    start_index = existing + 1
    for i in range(start_index, required + 1):
        keyword = keywords[(i - 1) % len(keywords)]
        url = build_url(keyword, size, sig=i)
        filename = f"{prefix}-{i}.jpg"
        output = target_dir / filename
        try:
            download_image(url, output)
            print(f"  OK {filename} <- {keyword}")
        except Exception as exc:  # noqa: BLE001
            print(f"  FAIL {filename}: {exc}")
        time.sleep(0.4)


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    keywords_path = root / "scripts" / "image_keywords.json"
    keywords_map = load_keywords(keywords_path)
    base_dir = root / "public" / "seed_mau"

    for industry_key, keyword_set in keywords_map.items():
        for type_key in TYPE_COUNTS:
            if type_key not in keyword_set:
                print(f"{industry_key}/{type_key}: thiếu keyword, bỏ qua")
                continue
            download_type(industry_key, type_key, keyword_set[type_key], base_dir)


if __name__ == "__main__":
    main()
