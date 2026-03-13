"""
generate_mobile_images.py

Workflow:
  1. Lägg uncompressed originalbilder i "original/" mapp
  2. Kör scriptet: python generate_mobile_images.py
  3. Scriptet skapar automatiskt:
     - "desktop/" mapp med komprimerade desktop-versioner
     - "mobile/" mapp med komprimerade mobil-versioner
     - Renumrerar bilder 01, 02, 03... för att fylla luckor

Kräver Pillow:
  pip install Pillow
"""

from PIL import Image
from pathlib import Path
import shutil
import sys
import io

# Fix Unicode on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── Inställningar ────────────────────────────────────────────────────────────

ROOT = Path(".")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

DESKTOP_QUALITY = 82
DESKTOP_MAX_KB  = 600

MOBILE_MAX_WIDTH = 800
MOBILE_QUALITY   = 75
MOBILE_MAX_KB    = 300

# ── Hjälpfunktioner ──────────────────────────────────────────────────────────

def image_format(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in {".jpg", ".jpeg"}: return "JPEG"
    if ext == ".png": return "PNG"
    if ext == ".webp": return "WEBP"
    return "JPEG"

def save_compressed(img, path, quality, max_kb):
    fmt = image_format(path)
    q = quality
    while q >= 40:
        img.save(path, fmt, quality=q, optimize=True)
        if path.stat().st_size / 1024 <= max_kb:
            return q, path.stat().st_size / 1024
        q -= 5
    img.save(path, fmt, quality=40, optimize=True)
    return 40, path.stat().st_size / 1024

def to_rgb_if_needed(img, path):
    if image_format(path) == "JPEG" and img.mode in ("RGBA", "P"):
        return img.convert("RGB")
    return img

# ── Backup ───────────────────────────────────────────────────────────────────

def create_backup(src: Path):
    rel = src.relative_to(ROOT)
    dst = ROOT / "backup" / rel
    if dst.exists():
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

# ── Resekvensering ───────────────────────────────────────────────────────────

def resequence_originals():
    """Re-sekvensera originalbilder i original/-mapp för att fylla luckor"""
    paintings_dir = ROOT / "images" / "paintings"

    if not paintings_dir.exists():
        return

    # Hitta alla "original/" mappar
    for original_folder in paintings_dir.glob("*/original"):
        if not original_folder.is_dir():
            continue

        # Få alla originalbilder, sorterade
        original_images = sorted([
            p for p in original_folder.glob("*")
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        ])

        if not original_images:
            continue

        # Re-sekvensera originalbilder för att fylla luckor
        for idx, img_path in enumerate(original_images, start=1):
            new_name = f"{idx:02d}{img_path.suffix.lower()}"
            new_path = img_path.parent / new_name

            if img_path != new_path:
                img_path.rename(new_path)
                print(f"📝 Döpte om original: {img_path.name} → {new_name}")

# ── Bearbeta bilder ──────────────────────────────────────────────────────────

def process_image(src: Path, painting_folder: Path):
    """Komprimera original från original/-mapp och skapa desktop/mobile-versioner"""
    orig_kb = src.stat().st_size / 1024
    create_backup(src)

    with Image.open(src) as img:
        img = to_rgb_if_needed(img, src)
        orig_w, orig_h = img.size

        # Desktop – spara i desktop/-mapp
        desktop_dir = painting_folder / "desktop"
        desktop_dir.mkdir(exist_ok=True)
        desktop_path = desktop_dir / src.name

        used_q, desk_kb = save_compressed(img, desktop_path, DESKTOP_QUALITY, DESKTOP_MAX_KB)
        print(f"✓  {src.name}")
        print(f"   Desktop: {orig_w}×{orig_h}px  {orig_kb:.0f}kb → {desk_kb:.0f}kb  (kvalitet {used_q})")

        # Mobil – skala + komprimera, spara i mobile/-mapp
        mobile_dir = painting_folder / "mobile"
        mobile_dir.mkdir(exist_ok=True)
        mobile_path = mobile_dir / src.name

        if orig_w > MOBILE_MAX_WIDTH:
            ratio = MOBILE_MAX_WIDTH / orig_w
            mob_img = img.resize((MOBILE_MAX_WIDTH, int(orig_h * ratio)), Image.LANCZOS)
        else:
            mob_img = img

        mob_q, mob_kb = save_compressed(mob_img, mobile_path, MOBILE_QUALITY, MOBILE_MAX_KB)
        mob_w, mob_h = mob_img.size
        print(f"   Mobil:   {mob_w}×{mob_h}px  {mob_kb:.0f}kb  (kvalitet {mob_q})\n")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    paintings_dir = ROOT / "images" / "paintings"

    if not paintings_dir.exists():
        print("❌ images/paintings/ mapp finns inte!")
        return

    # Steg 1: Re-sekvensera originalbilder för att fylla luckor
    print("📝 Re-sekvenserar originalbilder...\n")
    resequence_originals()

    # Steg 2: Ta bort desktop- och mobile-mappar för ren regenerering
    print("\n🗑  Raderar gamla compressed bilder...\n")
    for folder_type in ["desktop", "mobile"]:
        for old_folder in paintings_dir.glob(f"*/{folder_type}"):
            if old_folder.is_dir():
                for img in old_folder.glob("*"):
                    if img.is_file():
                        img.unlink()
                print(f"🗑  Raderade alla bilder i: {old_folder}")

    # Steg 3: Bearbeta originalbilder och skapa desktop/mobile-versioner
    print("\n🆕 Bearbetar originalbilder...\n")

    total_processed = 0
    for original_folder in sorted(paintings_dir.glob("*/original")):
        painting_folder = original_folder.parent

        # Få alla originalbilder, sorterade
        original_images = sorted([
            p for p in original_folder.glob("*")
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        ])

        if not original_images:
            continue

        print(f"📁 {painting_folder.name}/ ({len(original_images)} bild(er))\n")
        for src in original_images:
            process_image(src, painting_folder)
            total_processed += 1

    if total_processed == 0:
        print("Inga originalbilder hittades i original/-mappar.")
        return

    print(f"✅ Bearbetade {total_processed} bild(er) totalt!")

if __name__ == "__main__":
    main()
