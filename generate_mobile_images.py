"""
generate_mobile_images.py

1. Skapar backup av NYA bilder
2. Komprimerar NYA originalbilder på plats (desktop)
3. Skapar mobilversioner av NYA bilder i "mobile/"-undermappar

Håller koll på behandlade bilder i "processed.txt".
Kör skriptet igen när du lägger till nya bilder – bara de nya bearbetas!

Användning:
  1. Lägg filen i samma mapp som index.html
  2. Kör i Spyder eller terminal: python generate_mobile_images.py

Kräver Pillow:
  pip install Pillow
"""

from PIL import Image
from pathlib import Path
import shutil

# ── Inställningar ────────────────────────────────────────────────────────────

ROOT = Path(".")
LOG_FILE = ROOT / "processed.txt"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

DESKTOP_QUALITY = 82
DESKTOP_MAX_KB  = 600

MOBILE_MAX_WIDTH = 800
MOBILE_QUALITY   = 75
MOBILE_MAX_KB    = 300

# ── Logg ─────────────────────────────────────────────────────────────────────

def load_log() -> set:
    if not LOG_FILE.exists():
        return set()
    return set(LOG_FILE.read_text(encoding="utf-8").splitlines())

def save_to_log(path: Path, log: set):
    log.add(str(path))
    LOG_FILE.write_text("\n".join(sorted(log)), encoding="utf-8")

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

# ── Bearbeta ─────────────────────────────────────────────────────────────────

def process_image(src: Path, log: set):
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

    save_to_log(src, log)

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    log = load_log()

    all_images = [
        p for p in ROOT.rglob("*")
        if p.suffix.lower() in IMAGE_EXTENSIONS
        and "mobile" not in p.parts
        and "backup" not in p.parts
    ]

    new_images = [p for p in all_images if str(p) not in log]
    skipped    = len(all_images) - len(new_images)

    print(f"Hittade {len(all_images)} bild(er) totalt.")
    if skipped:
        print(f"⏭  Hoppar över {skipped} redan behandlade bild(er).")
    if not new_images:
        print("Inga nya bilder att behandla. Klart!")
        return

    print(f"🆕 Behandlar {len(new_images)} ny(a) bild(er)...\n")
    for src in new_images:
        process_image(src, log)

    print("✅ Klart!")

if __name__ == "__main__":
    main()