import os
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
import multiprocessing


def convert_to_webp(args):
    """Convert single image to WebP with best quality/compression ratio."""
    input_path, output_path = args

    try:
        with Image.open(input_path) as img:
            if img.mode == "P":
                img = img.convert("RGBA")

            if img.mode == "RGBA":
                if img.split()[3].getextrema()[0] == 255:
                    img = img.convert("RGB")
            elif img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")

            img.save(
                output_path,
                format="WEBP",
                quality=85,
                method=6,
                lossless=False,
            )

            original_size = os.path.getsize(input_path)
            new_size = os.path.getsize(output_path)
            reduction = (1 - new_size / original_size) * 100

            print(
                f"[OK] {os.path.basename(input_path)} -> {os.path.basename(output_path)} | "
                f"{original_size//1024}KB -> {new_size//1024}KB ({reduction:.1f}% smaller)"
            )
            return (input_path, True)

    except Exception as e:
        print(f"[FAIL] {os.path.basename(input_path)}: {e}")
        return (input_path, False)


def optimize_images_recursive(root_folder):
    """Convert all images in folder tree to WebP and DELETE originals."""

    supported_formats = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".gif"}

    tasks = []

    for dirpath, _, filenames in os.walk(root_folder):
        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower()

            if ext in supported_formats:
                input_path = os.path.join(dirpath, filename)
                output_filename = os.path.splitext(filename)[0] + ".webp"
                output_path = os.path.join(dirpath, output_filename)

                if os.path.exists(output_path):
                    print(f"[SKIP] {output_filename} already exists")
                    continue

                tasks.append((input_path, output_path))

    if not tasks:
        print("No images found to convert.")
        return

    print(f"Converting {len(tasks)} images to WebP...\n")

    num_workers = min(multiprocessing.cpu_count(), len(tasks))

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        results = list(executor.map(convert_to_webp, tasks))

    deleted_count = 0
    for original_path, success in results:
        if success:
            try:
                os.remove(original_path)
                deleted_count += 1
            except Exception as e:
                print(f"[WARN] Could not delete {original_path}: {e}")

    success_count = sum(1 for _, success in results if success)
    print(
        f"\nDone! {success_count}/{len(tasks)} images converted, {deleted_count} originals deleted."
    )


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))

    print(f"Scanning directory: {current_dir}\n")
    optimize_images_recursive(current_dir)
