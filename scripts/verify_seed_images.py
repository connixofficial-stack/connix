from __future__ import annotations

from pathlib import Path
import sys


REQUIRED_COUNTS = {
    "hero": 5,
    "products": 24,
    "logos": 8,
}


def count_images(folder: Path) -> int:
    if not folder.exists():
        return 0
    return len([f for f in folder.iterdir() if f.is_file() and f.suffix.lower() == ".webp"])


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    seed_root = root / "public" / "seed_mau"
    industries = sorted([p for p in seed_root.iterdir() if p.is_dir()])

    print("Industry | Hero | Products | Logos | Status")
    print("-" * 62)

    has_missing = False

    for industry in industries:
        counts = {key: count_images(industry / key) for key in REQUIRED_COUNTS}
        status = "OK"
        for key, minimum in REQUIRED_COUNTS.items():
            if counts[key] < minimum:
                status = "MISSING"
                has_missing = True
                break

        print(
            f"{industry.name:20} | {counts['hero']:4} | {counts['products']:8} | "
            f"{counts['logos']:5} | {status}"
        )

    if has_missing:
        print("\n❌ Thiếu ảnh theo chuẩn README.md. Vui lòng bổ sung trước khi generate templates.")
        return 1

    print("\n✅ Đủ ảnh seed_mau theo chuẩn README.md.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
