@ -0,0 +1,166 @@
"""
generate_mobile_images.py

1. Resekvensera originalbilder för att fylla luckor
2. Komprimerar originalbilder på plats (desktop)
3. Skapar och komprimerar mobilversioner av alla bilder i "mobile/"-undermappar

Användning:
  1. Körs från scripts/sync_paintings.bat
  2. Eller från terminal: python scripts/generate_mobile_images.py

Kräver Pillow:
  pip install Pillow
"""

from PIL import Image
from pathlib import Path
import shutil

# ── Inställningar ────────────────────────────────────────────────────────────

ROOT = Path(".").parent  # Går upp en nivå till projektrot
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
    """Re-sekvensera originalbilder för att fylla luckor (01, 02, 03, 05 → 01, 02, 03, 04)"""
    paintings_dir = ROOT / "images" / "paintings"

    if not paintings_dir.exists():
        return

    # Hitta alla subfolders i paintings-mappen
    image_folders = set()
    for img_path in paintings_dir.rglob("*"):
        if img_path.suffix.lower() in IMAGE_EXTENSIONS and "mobile" not in img_path.parts:
            image_folders.add(img_path.parent)

    for folder in image_folders:
        original_images = sorted([p for p in folder.glob("*") if p.suffix.lower() in IMAGE_EXTENSIONS])

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

def process_image(src: Path):
    """Komprimera original och skapa mobilversion"""
    orig_kb = src.stat().st_size / 1024
    create_backup(src)

    with Image.open(src) as img:
        img = to_rgb_if_needed(img, src)
        orig_w, orig_h = img.size

        # Desktop – komprimera på plats
        used_q, desk_kb = save_compressed(img, src, DESKTOP_QUALITY, DESKTOP_MAX_KB)
        print(f"✓  {src}")
        print(f"   Desktop: {orig_w}×{orig_h}px  {orig_kb:.0f}kb → {desk_kb:.0f}kb  (kvalitet {used_q})")

        # Mobil – skala + komprimera
        mobile_dir = src.parent / "mobile"
        mobile_dir.mkdir(exist_ok=True)
        dst = mobile_dir / src.name

        if orig_w > MOBILE_MAX_WIDTH:
            ratio = MOBILE_MAX_WIDTH / orig_w
            mob_img = img.resize((MOBILE_MAX_WIDTH, int(orig_h * ratio)), Image.LANCZOS)
        else:
            mob_img = img

        mob_q, mob_kb = save_compressed(mob_img, dst, MOBILE_QUALITY, MOBILE_MAX_KB)
        mob_w, mob_h = mob_img.size
        print(f"   Mobil:   {mob_w}×{mob_h}px  {mob_kb:.0f}kb  (kvalitet {mob_q})\n")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # Steg 1: Re-sekvensera originalbilder för att fylla luckor
    print("📝 Re-sekvenserar originalbilder...\n")
    resequence_originals()

    # Steg 2: Ta bort alla mobile-bilder
    print("\n🗑  Raderar alla mobile-bilder...\n")
    paintings_dir = ROOT / "images" / "paintings"
    if paintings_dir.exists():
        for mobile_folder in paintings_dir.rglob("mobile"):
            if mobile_folder.is_dir():
                for mobile_img in mobile_folder.glob("*"):
                    if mobile_img.is_file():
                        mobile_img.unlink()
                print(f"🗑  Raderade alla bilder i: {mobile_folder}")

    # Steg 3: Bearbeta alla originalbilder
    print("\n🆕 Bearbetar och komprimerar bilder...\n")
    all_images = sorted([
        p for p in ROOT.rglob("*")
        if p.suffix.lower() in IMAGE_EXTENSIONS
        and "mobile" not in p.parts
        and "backup" not in p.parts
    ])

    if not all_images:
        print("Inga bilder hittades.")
        return

    print(f"Bearbetar {len(all_images)} bild(er)...\n")
    for src in all_images:
        process_image(src)

    print("✅ Klart!")

if __name__ == "__main__":
    main()