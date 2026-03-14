"""
generate_mobile_images.py

Workflow:
  1. Lägg uncompressed originalbilder i "original/" mapp
  2. Kör scriptet: python scripts/generate_mobile_images.py
  3. Scriptet skapar automatiskt:
     - "desktop/" mapp med komprimerade desktop-versioner
     - "mobile/" mapp med komprimerade mobil-versioner
     - Renumrerar bilder 01, 02, 03... för att fylla luckor

Kräver:
  pip install -r requirements.txt
  eller: pip install Pillow tqdm
"""

from PIL import Image, ImageOps
from pathlib import Path
import shutil
import sys
import io
import json
try:
    from tqdm import tqdm
except ImportError:
    # Fallback if tqdm not installed - shows simple progress
    class tqdm:
        def __init__(self, iterable=None, total=None, desc="", unit="", *args, **kwargs):
            self.iterable = iterable if iterable is not None else []
            self.total = total or len(self.iterable)
            self.desc = desc
            self.unit = unit
            self.count = 0

            if self.desc:
                print(f"{self.desc}...", flush=True)

        def __iter__(self):
            for item in self.iterable:
                self.count += 1
                if self.desc and self.total > 0:
                    percent = (self.count / self.total) * 100
                    print(f"  {self.desc}: {self.count}/{self.total} ({percent:.0f}%)", end='\r', flush=True)
                yield item
            if self.desc:
                print()  # New line after progress

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def update(self, n=1):
            self.count += n
            if self.desc and self.total > 0:
                percent = (self.count / self.total) * 100
                print(f"  {self.desc}: {self.count}/{self.total} ({percent:.0f}%)", end='\r', flush=True)

        @staticmethod
        def write(msg):
            print(msg)

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

# ── Resekvensering ───────────────────────────────────────────────────────────

def resequence_originals():
    """Re-sekvensera originalbilder i original/-mapp för att fylla luckor"""
    paintings_dir = ROOT / "images" / "paintings"

    if not paintings_dir.exists():
        return

    # Hitta alla "original/" mappar
    original_folders = list(paintings_dir.glob("*/original"))

    for original_folder in tqdm(original_folders, desc="Re-sekvenserar originalbilder", unit="mapp"):
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

# ── Bearbeta bilder ──────────────────────────────────────────────────────────

def process_image(src: Path, painting_folder: Path):
    """Komprimera original från original/-mapp och skapa desktop/mobile-versioner"""
    orig_kb = src.stat().st_size / 1024

    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)
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

# ── Generera counts.json ──────────────────────────────────────────────────────

def generate_counts_json():
    """Generate counts.json with image counts for each painting folder"""
    paintings_dir = ROOT / "images" / "paintings"
    counts = {}

    folders = [f for f in sorted(paintings_dir.iterdir()) if f.is_dir()]

    for painting_folder in tqdm(folders, desc="Genererar counts.json", unit="mapp"):
        desktop_folder = painting_folder / "desktop"
        if desktop_folder.exists():
            # Count actual images in desktop folder
            images = [
                p for p in desktop_folder.glob("*")
                if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
            ]
            if images:
                counts[painting_folder.name] = len(images)

    # Write counts.json
    counts_file = paintings_dir / "counts.json"
    with open(counts_file, "w", encoding="utf-8") as f:
        json.dump(counts, f, indent=2, ensure_ascii=False)

    print(f"✅ counts.json uppdaterad!")

# ── Generera metadata.json ────────────────────────────────────────────────────

def generate_metadata_json():
    """Generate metadata.json with aspect ratios for each painting's 01.jpg"""
    paintings_dir = ROOT / "images" / "paintings"
    metadata = {}

    folders = [f for f in sorted(paintings_dir.iterdir()) if f.is_dir()]

    for painting_folder in tqdm(folders, desc="Genererar metadata.json", unit="mapp"):
        desktop_folder = painting_folder / "desktop"
        if not desktop_folder.exists():
            continue

        # Check if 01.jpg exists
        first_image = desktop_folder / "01.jpg"
        if not first_image.exists():
            continue

        # Open image and get dimensions
        try:
            with Image.open(first_image) as img:
                width, height = img.size
                aspect_ratio = round(width / height, 4)
                metadata[painting_folder.name] = aspect_ratio
        except Exception as e:
            tqdm.write(f"⚠️  Kunde inte läsa {first_image}: {e}")

    # Write metadata.json
    metadata_file = paintings_dir / "metadata.json"
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"✅ metadata.json uppdaterad!")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    paintings_dir = ROOT / "images" / "paintings"

    if not paintings_dir.exists():
        print("❌ images/paintings/ mapp finns inte!")
        return

    # Steg 1: Re-sekvensera originalbilder för att fylla luckor
    print("📝 Re-sekvenserar originalbilder...")
    resequence_originals()
    print("✅ Re-sekvensering klar!\n")

    # Steg 2: Ta bort desktop- och mobile-mappar för ren regenerering
    print("🗑  Raderar gamla compressed bilder...")
    old_folders = []
    for folder_type in ["desktop", "mobile"]:
        old_folders.extend(paintings_dir.glob(f"*/{folder_type}"))

    for old_folder in tqdm(old_folders, desc="Raderar gamla bilder", unit="mapp"):
        if old_folder.is_dir():
            for img in old_folder.glob("*"):
                if img.is_file():
                    img.unlink()

    print("✅ Radering klar!\n")

    # Steg 3: Bearbeta originalbilder och skapa desktop/mobile-versioner
    print("🆕 Bearbetar originalbilder...")

    # Först räkna totalt antal bilder för progress bar
    all_images = []
    all_folders = []
    for original_folder in sorted(paintings_dir.glob("*/original")):
        painting_folder = original_folder.parent
        original_images = sorted([
            p for p in original_folder.glob("*")
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        ])
        if original_images:
            all_images.extend([(src, painting_folder) for src in original_images])
            all_folders.append((painting_folder, len(original_images)))

    if not all_images:
        print("Inga originalbilder hittades i original/-mappar.")
        return

    # Bearbeta bilder med progress bar
    with tqdm(total=len(all_images), desc="Bearbetar bilder", unit="bild") as pbar:
        current_folder = None
        for src, painting_folder in all_images:
            if painting_folder != current_folder:
                current_folder = painting_folder
                pbar.write(f"📁 {painting_folder.name}/ ({len([s for s, f in all_images if f == painting_folder])} bild(er))")
            process_image(src, painting_folder)
            pbar.update(1)

    total_processed = len(all_images)

    print(f"\n✅ Bildbearbetning klar! ({total_processed} bild(er) totalt)\n")

    # Steg 4: Generera counts.json för att uppdatera image counts på webbplatsen
    print("📊 Genererar counts.json...")
    generate_counts_json()
    print("✅ counts.json klar!\n")

    # Steg 5: Generera metadata.json för aspect ratios
    print("📊 Genererar metadata.json...")
    generate_metadata_json()
    print("✅ metadata.json klar!\n")

    print("=" * 50)
    print("🎉 Allt klart! Alla bilder är bearbetade!")
    print("=" * 50)

if __name__ == "__main__":
    main()
