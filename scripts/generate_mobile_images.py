"""
generate_mobile_images.py

Bygger desktop/- och mobile-versionerna av målningsbilderna från original/.

Arbetsflöde:
  1. Lägg okomprimerade originalbilder i "images/paintings/<id>/original/"
  2. Kör scriptet (eller sync_paintings_images.bat, som gör allt i ett svep)
  3. Scriptet skapar:
     - "desktop/" med komprimerade desktopversioner
     - "mobile/" med komprimerade mobilversioner
     - counts.json och metadata.json, alltid från hela katalogen
     - .image-build.json, kvittot på vad varje målning byggdes från

Lägen:
  (utan flagga)      bygger bara om målningar vars originalbilder ändrats
  --only <id>        bygger om en enda målning (kan upprepas)
  --all              bygger om allt från grunden
  --check            kontrollerar bara, ändrar ingenting (avslutar 1 vid fel)
  --accept-current   skriver kvittot för allt som redan ligger på disken,
                     utan att bygga om (används en gång, för att komma igång)
  --root <sökväg>    kör mot en annan projektmapp än den aktuella

Varför kvittot finns:
  Ett inkrementellt bygge är bara säkert om det går att bevisa efteråt. Därför
  sparar .image-build.json en sha256-summa av varje originalbild. Nästa körning
  hashar om allt — det tar någon sekund mot minuter för en omkodning — och kan
  då säga exakt vilka målningar som ligger i otakt med sina original. Summorna
  följer innehållet, inte tidsstämplar, så de överlever en ny git-klon.

  counts.json och metadata.json byggs alltid om från hela katalogen. De är
  billiga att räkna fram och är just det som annars tyst hamnar fel när bara
  en målning byggts om.

Kräver:
  pip install -r requirements.txt
  eller: pip install Pillow tqdm
"""

from PIL import Image, ImageOps
from pathlib import Path
import argparse
import hashlib
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

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

DESKTOP_QUALITY = 82
DESKTOP_MAX_KB  = 600

MOBILE_MAX_WIDTH = 800
MOBILE_QUALITY   = 75
MOBILE_MAX_KB    = 300

MANIFEST_NAME = ".image-build.json"

# Sa manga rader planen visar innan den sammanfattar resten
MAX_PLAN_ROWS = 14

# Ändras någon av de här får alla målningar byggas om — de gamla filerna är
# komprimerade med andra värden än de vi lovar
BUILD_SETTINGS = {
    "desktop_quality":  DESKTOP_QUALITY,
    "desktop_max_kb":   DESKTOP_MAX_KB,
    "mobile_max_width": MOBILE_MAX_WIDTH,
    "mobile_quality":   MOBILE_QUALITY,
    "mobile_max_kb":    MOBILE_MAX_KB,
}

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

def paintings_root(root: Path) -> Path:
    return root / "images" / "paintings"

def clay_root(root: Path) -> Path:
    return root / "images" / "lera"

def bookmarks_root(root: Path) -> Path:
    return root / "images" / "bookmarks"

def painting_folders(root: Path):
    """Alla målningsmappar, i bokstavsordning"""
    directory = paintings_root(root)
    if not directory.exists():
        return []
    return [f for f in sorted(directory.iterdir()) if f.is_dir()]

def clay_folders(root: Path):
    """Alla lerklumpsmappar, i bokstavsordning"""
    directory = clay_root(root)
    if not directory.exists():
        return []
    return [f for f in sorted(directory.iterdir()) if f.is_dir()]

def bookmarks_files(root: Path):
    """Alla bokmarksfiler (från original/ eller root), i bokstavsordning"""
    directory = bookmarks_root(root)
    if not directory.exists():
        return []
    # Bokmarks-original ligger i bookmarks/original/ subdir
    original_dir = directory / "original"
    if original_dir.exists():
        return sorted([
            p for p in original_dir.glob("*")
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        ])
    return []

def images_in(folder: Path):
    """Bildfilerna i en mapp, i bokstavsordning"""
    if not folder.exists():
        return []
    return sorted([
        p for p in folder.glob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ])

def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def source_hashes(painting_folder: Path) -> dict:
    """Namn → sha256 för målningens originalbilder"""
    return {img.name: file_hash(img) for img in images_in(painting_folder / "original")}

# ── Kvitto (manifest) ────────────────────────────────────────────────────────

def load_manifest(root: Path) -> dict:
    manifest_file = paintings_root(root) / MANIFEST_NAME
    if not manifest_file.exists():
        return {"settings": {}, "paintings": {}, "clay": {}, "bookmarks": {}}
    try:
        with open(manifest_file, encoding="utf-8") as f:
            manifest = json.load(f)
    except (json.JSONDecodeError, OSError):
        print(f"⚠️  {MANIFEST_NAME} gick inte att läsa — allt räknas som oförbyggt")
        return {"settings": {}, "paintings": {}, "clay": {}, "bookmarks": {}}
    manifest.setdefault("settings", {})
    manifest.setdefault("paintings", {})
    manifest.setdefault("clay", {})
    manifest.setdefault("bookmarks", {})
    return manifest

def save_manifest(root: Path, manifest: dict):
    manifest_file = paintings_root(root) / MANIFEST_NAME
    manifest["settings"] = BUILD_SETTINGS
    manifest["paintings"] = dict(sorted(manifest["paintings"].items()))
    manifest["clay"] = dict(sorted(manifest["clay"].items()))
    manifest["bookmarks"] = dict(sorted(manifest["bookmarks"].items()))
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")

def is_empty_painting(painting_folder: Path) -> bool:
    """En mapp utan originalbilder — halvfardig eller bortglomd"""
    return not images_in(painting_folder / "original")

def is_empty_clay(clay_folder: Path) -> bool:
    """En lerklump utan originalbilder"""
    return not images_in(clay_folder / "original")

def is_empty_bookmarks(root: Path) -> bool:
    """Bokmarksar utan originalbilder"""
    return not bookmarks_files(root)


def stale_kind(painting_folder: Path, manifest: dict):
    """(sort, förklaring) för en målning som behöver byggas om, annars None"""
    name = painting_folder.name
    sources = source_hashes(painting_folder)

    if not sources:
        # Ingen rebuild i varlden kan fylla en tom mapp — den hanteras for sig
        return None

    expected = sorted(sources)
    if expected != [f"{i:02d}{Path(n).suffix.lower()}" for i, n in enumerate(expected, start=1)]:
        return ("omnumreras", "originalbilderna är inte numrerade 01, 02, 03…")

    if manifest.get("settings") != BUILD_SETTINGS:
        return ("installningar", "komprimeringsinställningarna har ändrats")

    recorded = manifest["paintings"].get(name)
    if recorded is None:
        return ("ny", f"{len(sources)} bild(er), aldrig byggd av det här scriptet")
    if recorded.get("sources") != sources:
        added = len(sources) - len(recorded.get("sources", {}))
        if added > 0:
            detalj = f"{added} bild(er) tillkomna, {len(sources)} totalt"
        elif added < 0:
            detalj = f"{-added} bild(er) borttagna, {len(sources)} kvar"
        else:
            detalj = f"bilderna har bytts ut, {len(sources)} totalt"
        return ("andrad", detalj)

    for variant in ("desktop", "mobile"):
        built = [img.name for img in images_in(painting_folder / variant)]
        if built != expected:
            return ("ofullstandig",
                    f"{variant}/ stämmer inte med original/ ({len(built)} av {len(expected)} bilder)")

    return None


def stale_reason(painting_folder: Path, manifest: dict, hashes: dict = None):
    """Varför målningen behöver byggas om, eller None om den är i takt"""
    kind = stale_kind(painting_folder, manifest)
    return None if kind is None else kind[1]

# ── Resekvensering ───────────────────────────────────────────────────────────

def resequence_originals(painting_folder: Path):
    """Numrerar om original/ till 01, 02, 03… och gör ändelsen gemen"""
    originals = images_in(painting_folder / "original")
    if not originals:
        return

    for idx, img_path in enumerate(originals, start=1):
        new_path = img_path.parent / f"{idx:02d}{img_path.suffix.lower()}"
        if img_path == new_path:
            continue
        # Via ett mellannamn: Windows filsystem är skiftlägesokänsligt, så
        # 01.JPG → 01.jpg är annars inte alltid en tillåten omdöpning
        temp_path = img_path.parent / f"__tmp_{idx:02d}{img_path.suffix.lower()}"
        img_path.rename(temp_path)
        temp_path.rename(new_path)

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

def build_painting(painting_folder: Path, manifest: dict):
    """Bygger om en målning och skriver in den i kvittot"""
    resequence_originals(painting_folder)

    # Töm desktop/ och mobile/ först, annars blir borttagna bilder kvar
    for variant in ("desktop", "mobile"):
        variant_dir = painting_folder / variant
        variant_dir.mkdir(exist_ok=True)
        for old in variant_dir.glob("*"):
            if old.is_file():
                old.unlink()

    originals = images_in(painting_folder / "original")
    print(f"📁 {painting_folder.name}/ ({len(originals)} bild(er))")
    for src in originals:
        process_image(src, painting_folder)

    manifest["paintings"][painting_folder.name] = {"sources": source_hashes(painting_folder)}
    return len(originals)

def build_clay(clay_folder: Path, manifest: dict):
    """Bygger om en lerklump och skriver in den i kvittot"""
    resequence_originals(clay_folder)

    # Töm desktop/ och mobile/ först
    for variant in ("desktop", "mobile"):
        variant_dir = clay_folder / variant
        variant_dir.mkdir(exist_ok=True)
        for old in variant_dir.glob("*"):
            if old.is_file():
                old.unlink()

    originals = images_in(clay_folder / "original")
    print(f"🧿 {clay_folder.name}/ ({len(originals)} bild(er))")
    for src in originals:
        process_image(src, clay_folder)

    manifest["clay"][clay_folder.name] = {"sources": source_hashes(clay_folder)}
    return len(originals)

def build_bookmarks(root: Path, manifest: dict):
    """Bygger om bokmarkarna och skriver in dem i kvittot"""
    bookmarks_dir = bookmarks_root(root)
    original_dir = bookmarks_dir / "original"
    
    if not original_dir.exists():
        return 0
    
    # Töm desktop/ och mobile/ först
    for variant in ("desktop", "mobile"):
        variant_dir = bookmarks_dir / variant
        variant_dir.mkdir(exist_ok=True)
        for old in variant_dir.glob("*"):
            if old.is_file():
                old.unlink()

    originals = images_in(original_dir)
    print(f"🔖 bookmarks/ ({len(originals)} bild(er))")
    for src in originals:
        process_image(src, bookmarks_dir)

    manifest["bookmarks"]["cover"] = {"sources": {img.name: file_hash(img) for img in originals}}
    return len(originals)

# ── Generera counts.json ──────────────────────────────────────────────────────

def generate_counts_json(root: Path):
    """Generate counts.json with image counts for each product folder"""
    counts = {}

    for painting_folder in tqdm(painting_folders(root), desc="Genererar counts.json", unit="mapp"):
        images = images_in(painting_folder / "desktop")
        if images:
            counts[painting_folder.name] = len(images)

    for clay_folder in tqdm(clay_folders(root), desc="Genererar counts.json (clay)", unit="mapp"):
        images = images_in(clay_folder / "desktop")
        if images:
            counts[clay_folder.name] = len(images)

    bookmarks_images = images_in(bookmarks_root(root) / "desktop")
    if bookmarks_images:
        counts["bookmarks"] = len(bookmarks_images)

    counts_file = paintings_root(root) / "counts.json"
    with open(counts_file, "w", encoding="utf-8") as f:
        json.dump(counts, f, indent=2, ensure_ascii=False)

    print("✅ counts.json uppdaterad!")

def generate_metadata_json(root: Path):
    """Generate metadata.json with aspect ratios for each product's first image"""
    metadata = {}

    for painting_folder in tqdm(painting_folders(root), desc="Genererar metadata.json", unit="mapp"):
        first_image = painting_folder / "desktop" / "01.jpg"
        if not first_image.exists():
            continue

        try:
            with Image.open(first_image) as img:
                width, height = img.size
                metadata[painting_folder.name] = round(width / height, 4)
        except Exception as e:
            tqdm.write(f"⚠️  Kunde inte läsa {first_image}: {e}")

    for clay_folder in tqdm(clay_folders(root), desc="Genererar metadata.json (clay)", unit="mapp"):
        first_image = clay_folder / "desktop" / "01.jpg"
        if not first_image.exists():
            continue

        try:
            with Image.open(first_image) as img:
                width, height = img.size
                metadata[clay_folder.name] = round(width / height, 4)
        except Exception as e:
            tqdm.write(f"⚠️  Kunde inte läsa {first_image}: {e}")

    bookmarks_first = bookmarks_root(root) / "desktop" / "01.jpg"
    if bookmarks_first.exists():
        try:
            with Image.open(bookmarks_first) as img:
                width, height = img.size
                metadata["bookmarks"] = round(width / height, 4)
        except Exception as e:
            tqdm.write(f"⚠️  Kunde inte läsa {bookmarks_first}: {e}")

    metadata_file = paintings_root(root) / "metadata.json"
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print("✅ metadata.json uppdaterad!")

# ── Kontroll ─────────────────────────────────────────────────────────────────

def check(root: Path, manifest: dict):
    """(fel, varningar) — fel maste ratas, varningar sags bara till om"""
    problems = []
    warnings = []
    
    # Check paintings
    folders = painting_folders(root)
    folder_names = {f.name for f in folders}

    for painting_folder in tqdm(folders, desc="Kontrollerar målningar", unit="mapp"):
        reason = stale_reason(painting_folder, manifest)
        if reason:
            problems.append(f"Målning {painting_folder.name}: {reason}")

    for painting_folder in folders:
        if is_empty_painting(painting_folder):
            warnings.append(
                f"Målning {painting_folder.name}: mappen har inga originalbilder — "
                f"lägg tillbaka dem eller ta bort mappen")

    for name in sorted(set(manifest["paintings"]) - folder_names):
        problems.append(f"Målning {name}: står kvar i {MANIFEST_NAME} men mappen finns inte längre")

    # Check clay
    clay_folds = clay_folders(root)
    clay_names = {f.name for f in clay_folds}

    for clay_folder in tqdm(clay_folds, desc="Kontrollerar lerklumpar", unit="mapp"):
        reason = stale_reason(clay_folder, manifest)
        if reason:
            problems.append(f"Clay {clay_folder.name}: {reason}")

    for clay_folder in clay_folds:
        if is_empty_clay(clay_folder):
            warnings.append(
                f"Clay {clay_folder.name}: mappen har inga originalbilder — "
                f"lägg tillbaka dem eller ta bort mappen")

    for name in sorted(set(manifest.get("clay", {})) - clay_names):
        problems.append(f"Clay {name}: står kvar i {MANIFEST_NAME} men mappen finns inte längre")

    # Check counts.json and metadata.json
    counts_file = paintings_root(root) / "counts.json"
    metadata_file = paintings_root(root) / "metadata.json"

    counts = json.loads(counts_file.read_text(encoding="utf-8")) if counts_file.exists() else {}
    metadata = json.loads(metadata_file.read_text(encoding="utf-8")) if metadata_file.exists() else {}

    all_product_names = folder_names | clay_names

    for name in all_product_names:
        if name in folder_names:
            built = len(images_in(paintings_root(root) / name / "desktop"))
        else:
            built = len(images_in(clay_root(root) / name / "desktop"))

        if built == 0:
            continue
        if counts.get(name) != built:
            problems.append(f"{name}: counts.json säger {counts.get(name)}, {built} bild(er) på disken")
        if name not in metadata:
            problems.append(f"{name}: saknas i metadata.json")

    for name in sorted(set(counts) - all_product_names):
        problems.append(f"{name}: står kvar i counts.json men finns inte längre")
    for name in sorted(set(metadata) - all_product_names):
        problems.append(f"{name}: står kvar i metadata.json men finns inte längre")

    return problems, warnings


def print_warnings(warnings):
    if not warnings:
        return
    print("\n⚠️  Varningar (inget som stoppar bygget):")
    for warning in warnings:
        print(f"   • {warning}")

# ── Plan ─────────────────────────────────────────────────────────────────────

def print_plan(root: Path, manifest: dict) -> int:
    """Visar vad en synk skulle gora. Rör ingenting."""
    folders = painting_folders(root)
    grupper = {"ny": [], "andrad": [], "omnumreras": [], "ofullstandig": [], "installningar": []}
    tomma = []

    for painting_folder in tqdm(folders, desc="Jämför med kvittot", unit="mapp"):
        if is_empty_painting(painting_folder):
            tomma.append(painting_folder.name)
            continue
        kind = stale_kind(painting_folder, manifest)
        if kind:
            grupper[kind[0]].append((painting_folder.name, kind[1]))

    borttagna = sorted(set(manifest["paintings"]) - {f.name for f in folders})

    rubriker = [
        ("ny", "NYA"),
        ("andrad", "ÄNDRADE"),
        ("omnumreras", "OMNUMRERAS"),
        ("ofullstandig", "OFULLSTÄNDIGA"),
        ("installningar", "NYA INSTÄLLNINGAR"),
    ]

    att_bygga = sum(len(grupper[key]) for key, _ in rubriker)

    rader = []
    for key, rubrik in rubriker:
        for name, detalj in grupper[key]:
            rader.append(f"   {rubrik:<18}{name}  ({detalj})")
    for name in borttagna:
        rader.append(f"   {'BORTTAGNA':<18}{name}  (mappen finns inte längre)")
    for name in tomma:
        rader.append(f"   {'TOMMA':<18}{name}  (inga originalbilder — läggs inte till)")

    # Listan star ovanfor menyn, sa den far inte trycka bort den fran skarmen
    print()
    for rad in rader[:MAX_PLAN_ROWS]:
        print(rad)
    if len(rader) > MAX_PLAN_ROWS:
        print(f"   ... och {len(rader) - MAX_PLAN_ROWS} till")

    if att_bygga == 0 and not borttagna:
        print("   Inga bilder har ändrats sedan förra körningen.")
    else:
        malning = "målning" if att_bygga == 1 else "målningar"
        print()
        print(f"   Att bygga om: {att_bygga} {malning}"
              + (f", att städa bort: {len(borttagna)}" if borttagna else ""))
    print()
    return 0


# ── Main ──────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(description="Bygger desktop- och mobilbilder från original/")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--all", action="store_true", help="bygg om alla målningar")
    mode.add_argument("--only", action="append", metavar="ID", default=[],
                      help="bygg om en enda målning (kan upprepas)")
    mode.add_argument("--check", action="store_true", help="kontrollera bara, ändra ingenting")
    mode.add_argument("--plan", action="store_true",
                      help="visa vad en synk skulle göra, utan att göra något")
    mode.add_argument("--accept-current", action="store_true",
                      help="skriv kvittot för det som redan ligger på disken, utan att bygga om")
    parser.add_argument("--root", default=".", metavar="SÖKVÄG", help="projektmapp (standard: .)")
    return parser.parse_args()

def main():
    args = parse_args()
    root = Path(args.root)

    if not paintings_root(root).exists():
        print("❌ images/paintings/ mapp finns inte!")
        return 1

    manifest = load_manifest(root)
    folders = painting_folders(root)
    clay_folds = clay_folders(root)
    by_name = {f.name: f for f in folders}
    clay_by_name = {f.name: f for f in clay_folds}

    # ── Bara visa vad som skulle hända ───────────────────────────────────────
    if args.plan:
        return print_plan(root, manifest)

    # ── Bara kontroll ────────────────────────────────────────────────────────
    if args.check:
        print("🔍 Kontrollerar att bilderna och datafilerna hänger ihop...\n")
        problems, warnings = check(root, manifest)
        if problems:
            print("\n❌ Följande ligger i otakt:")
            for problem in problems:
                print(f"   • {problem}")
            print("\n   Kör sync_paintings_images.bat och välj [1] för att rätta till det.")
            print_warnings(warnings)
            return 1
        total_products = len(folders) + len(clay_folds)
        print(f"\n✅ Alla {total_products} produkter stämmer med sina originalbilder!")
        print_warnings(warnings)
        return 0

    # ── Skriv kvitto utan att bygga om ───────────────────────────────────────
    if args.accept_current:
        print("📝 Skriver kvitto för bilderna som redan ligger på disken...\n")
        for painting_folder in tqdm(folders, desc="Läser målningsbilder", unit="mapp"):
            hashes = source_hashes(painting_folder)
            if hashes:
                manifest["paintings"][painting_folder.name] = {"sources": hashes}
        for clay_folder in tqdm(clay_folds, desc="Läser lerbilder", unit="mapp"):
            hashes = source_hashes(clay_folder)
            if hashes:
                manifest["clay"][clay_folder.name] = {"sources": hashes}
        # Tomma mappar och borttagna produkter hör inte hemma i kvittot
        for name in set(manifest["paintings"]) - set(by_name):
            del manifest["paintings"][name]
        for name in set(manifest.get("clay", {})) - set(clay_by_name):
            del manifest["clay"][name]
        for painting_folder in folders:
            if is_empty_painting(painting_folder):
                manifest["paintings"].pop(painting_folder.name, None)
        for clay_folder in clay_folds:
            if is_empty_clay(clay_folder):
                manifest["clay"].pop(clay_folder.name, None)
        save_manifest(root, manifest)
        total_painted = len(manifest["paintings"])
        total_clay = len(manifest.get("clay", {}))
        print(f"\n✅ Kvitto skrivet för {total_painted} målningar och {total_clay} lerklumpar.")
        print("   Nästa körning bygger bara om det som faktiskt ändrats.\n")
        generate_counts_json(root)
        generate_metadata_json(root)
        return 0

    # ── Välj vad som ska byggas ──────────────────────────────────────────────
    targets_paint = []
    targets_clay = []
    
    if args.only:
        all_by_name = {**by_name, **clay_by_name}
        unknown = [name for name in args.only if name not in all_by_name]
        if unknown:
            print(f"❌ Hittar ingen mapp för: {', '.join(unknown)}")
            all_names = sorted(set(by_name.keys()) | set(clay_by_name.keys()))
            if all_names:
                print(f"   Välj bland: {', '.join(all_names)}")
            return 1
        targets_paint = [by_name[name] for name in args.only if name in by_name]
        targets_clay = [clay_by_name[name] for name in args.only if name in clay_by_name]
        total_targets = len(targets_paint) + len(targets_clay)
        print(f"🎯 Bygger om {total_targets} produkt(er): {', '.join(args.only)}\n")
    elif args.all:
        targets_paint = folders
        targets_clay = clay_folds
        total_targets = len(targets_paint) + len(targets_clay)
        print(f"🔁 Bygger om alla {total_targets} produkter från grunden\n")
    else:
        print("🔍 Letar efter produkter som ändrats...\n")
        for painting_folder in tqdm(folders, desc="Jämför målningar", unit="mapp"):
            reason = stale_reason(painting_folder, manifest)
            if reason:
                targets_paint.append(painting_folder)
                tqdm.write(f"   • Målning {painting_folder.name}: {reason}")
        for clay_folder in tqdm(clay_folds, desc="Jämför lerklumpar", unit="mapp"):
            reason = stale_reason(clay_folder, manifest)
            if reason:
                targets_clay.append(clay_folder)
                tqdm.write(f"   • Clay {clay_folder.name}: {reason}")
        if not targets_paint and not targets_clay:
            print("\n✅ Inga bilder har ändrats — inget att bygga om.\n")

    # ── Bygg ─────────────────────────────────────────────────────────────────
    total_images = 0
    if targets_paint or targets_clay:
        print(f"\n🆕 Bearbetar originalbilder...\n")
        for painting_folder in targets_paint:
            total_images += build_painting(painting_folder, manifest)
        for clay_folder in targets_clay:
            total_images += build_clay(clay_folder, manifest)
        total_targets = len(targets_paint) + len(targets_clay)
        print(f"✅ Bildbearbetning klar! ({total_images} bild(er) i {total_targets} produkt(er))\n")

    # Tomma mappar gick aldrig att bygga — kvittoraden för dem säger ingenting
    emptied_paint = sorted(f.name for f in folders
                          if is_empty_painting(f) and f.name in manifest["paintings"])
    emptied_clay = sorted(f.name for f in clay_folds
                         if is_empty_clay(f) and f.name in manifest.get("clay", {}))
    for name in emptied_paint + emptied_clay:
        manifest["paintings"].pop(name, None)
        manifest["clay"].pop(name, None)
    if emptied_paint or emptied_clay:
        all_emptied = emptied_paint + emptied_clay
        print(f"⚠️  {', '.join(all_emptied)} har inga originalbilder kvar.")
        print("   Lägg tillbaka bilderna eller ta bort mappen.\n")

    # Borttagna produkter ska inte ligga kvar i kvittot
    removed_paint = sorted(set(manifest["paintings"]) - set(by_name))
    removed_clay = sorted(set(manifest.get("clay", {})) - set(clay_by_name))
    for name in removed_paint:
        del manifest["paintings"][name]
    for name in removed_clay:
        del manifest["clay"][name]
    if removed_paint or removed_clay:
        all_removed = removed_paint + removed_clay
        print(f"🗑  Tog bort {', '.join(all_removed)} ur kvittot (mappen finns inte längre)\n")

    save_manifest(root, manifest)

    # counts.json och metadata.json byggs alltid om från hela katalogen
    print("📊 Genererar counts.json...")
    generate_counts_json(root)
    print()
    print("📊 Genererar metadata.json...")
    generate_metadata_json(root)
    print()

    # ── Bevisa att resultatet hänger ihop ────────────────────────────────────
    print("🔍 Kontrollerar att allt hänger ihop...\n")
    problems, warnings = check(root, manifest)
    if problems:
        print("\n❌ Något ligger fortfarande i otakt:")
        for problem in problems:
            print(f"   • {problem}")
        print("\n   Kör om med --all för att bygga allt från grunden.")
        print_warnings(warnings)
        return 1

    print_warnings(warnings)
    print("=" * 50)
    print(f"🎉 Allt klart! {len(folders)} målningar stämmer med sina originalbilder.")
    print("=" * 50)
    return 0

if __name__ == "__main__":
    sys.exit(main())
