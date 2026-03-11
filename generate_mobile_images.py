# -*- coding: utf-8 -*-
"""
Created on Wed Mar 11 12:13:58 2026

@author: devik
"""

"""
generate_mobile_images.py

Skapar lågupplösta mobilversioner av alla bilder på sajten.
Mobilbilderna sparas i en "mobile"-undermapp bredvid originalet.

Exempel:
  images/paintings/sommarvila.jpg  →  images/paintings/mobile/sommarvila.jpg
  images/gallery/wolf.png          →  images/gallery/mobile/wolf.png

Användning:
  python generate_mobile_images.py

Kräver Pillow:
  pip install Pillow
"""

from PIL import Image
from pathlib import Path

# ── Inställningar ────────────────────────────────────────────────────────────

# Rotkatalog för sajten (ändra om du kör skriptet från annan plats)
ROOT = Path(".")

# Bildformat att behandla
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Max bredd på mobilbilden (höjden skalas proportionellt)
MAX_WIDTH = 800  # px

# JPEG/WebP-kvalitet (1–95). 75 ger bra balans storlek/skärpa
QUALITY = 75

# Max filstorlek i kb – bilder över detta komprimeras hårdare
MAX_KB = 300

# ── Hjälpfunktion ────────────────────────────────────────────────────────────

def compress_to_target(img: Image.Image, path: Path, quality: int, max_kb: int):
    """Sparar bilden och sänker kvaliteten stegvis tills den är under max_kb."""
    fmt = "JPEG" if path.suffix.lower() in {".jpg", ".jpeg"} else path.suffix[1:].upper()
    if fmt == "JPG":
        fmt = "JPEG"

    q = quality
    while q >= 40:
        path.write_bytes(b"")          # töm filen
        img.save(path, fmt, quality=q, optimize=True)
        size_kb = path.stat().st_size / 1024
        if size_kb <= max_kb:
            return q, size_kb
        q -= 5

    # Sista försöket med lägsta kvalitet
    img.save(path, fmt, quality=40, optimize=True)
    return 40, path.stat().st_size / 1024


# ── Huvudlogik ───────────────────────────────────────────────────────────────

def process_images(root: Path):
    images = [
        p for p in root.rglob("*")
        if p.suffix.lower() in IMAGE_EXTENSIONS
        and "mobile" not in p.parts          # hoppa över redan skapade mobilbilder
    ]

    if not images:
        print("Inga bilder hittades. Kontrollera att ROOT pekar rätt.")
        return

    print(f"Hittade {len(images)} bild(er). Börjar bearbeta...\n")

    for src in images:
        mobile_dir = src.parent / "mobile"
        mobile_dir.mkdir(exist_ok=True)
        dst = mobile_dir / src.name

        with Image.open(src) as img:
            # Konvertera RGBA→RGB för JPEG
            if img.mode in ("RGBA", "P") and src.suffix.lower() in {".jpg", ".jpeg"}:
                img = img.convert("RGB")

            orig_w, orig_h = img.size

            # Skala ner om bredare än MAX_WIDTH
            if orig_w > MAX_WIDTH:
                ratio = MAX_WIDTH / orig_w
                new_size = (MAX_WIDTH, int(orig_h * ratio))
                img = img.resize(new_size, Image.LANCZOS)
            else:
                new_size = (orig_w, orig_h)

            used_q, final_kb = compress_to_target(img, dst, QUALITY, MAX_KB)

        orig_kb = src.stat().st_size / 1024
        print(f"✓  {src}  →  mobile/{src.name}")
        print(f"   {orig_w}×{orig_h}px {orig_kb:.0f}kb  →  {new_size[0]}×{new_size[1]}px {final_kb:.0f}kb  (kvalitet {used_q})\n")

    print("Klart! 🎉")
    print()
    print("Tips – använd <picture> i HTML för att välja rätt bild automatiskt:")
    print("""
  <picture>
    <source media="(max-width: 768px)" srcset="images/paintings/mobile/sommarvila.jpg">
    <img src="images/paintings/sommarvila.jpg" alt="Sommarvila">
  </picture>
""")


if __name__ == "__main__":
    process_images(ROOT)