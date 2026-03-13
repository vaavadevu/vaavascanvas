"""
validate_images.py

Validates image structure in paintings folders:
1. No gaps in numbering (01, 02, 03... with no gaps)
2. Originals and mobile folders have same filenames and count

Usage:
  python validate_images.py

Exit codes:
  0 = Validation passed
  1 = Validation failed
"""

from pathlib import Path
import sys
import io

# Fix Unicode on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = Path(".")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

def get_image_numbers(images: list) -> set:
    """Extract numbers from image filenames (01, 02, 03...)"""
    numbers = set()
    for img in images:
        # Extract the number part (e.g., "01" from "01.jpg")
        name = img.stem
        if name and name[0:2].isdigit():
            numbers.add(int(name[0:2]))
    return numbers

def validate_no_gaps(numbers: set, folder_name: str) -> bool:
    """Check if numbers sequence has no gaps (1, 2, 3... not 1, 2, 4)"""
    if not numbers:
        return True

    max_num = max(numbers)
    expected = set(range(1, max_num + 1))

    if numbers != expected:
        missing = expected - numbers
        print(f"❌ {folder_name}: Lucka i numrering. Saknade: {sorted(missing)}")
        return False

    return True

def validate_sync(original_images: list, mobile_images: list, folder_name: str) -> bool:
    """Check if originals and mobile folders have same filenames"""
    orig_names = {img.name for img in original_images}
    mobile_names = {img.name for img in mobile_images}

    if orig_names != mobile_names:
        only_orig = orig_names - mobile_names
        only_mobile = mobile_names - orig_names

        if only_orig:
            print(f"❌ {folder_name}: Finns i original men INTE i mobile: {sorted(only_orig)}")
        if only_mobile:
            print(f"❌ {folder_name}: Finns i mobile men INTE i original: {sorted(only_mobile)}")

        return False

    return True

def main():
    paintings_dir = ROOT / "images" / "paintings"

    if not paintings_dir.exists():
        print("❌ Mappen images/paintings finns inte")
        return 1

    # Find all painting subfolders (not mobile)
    all_passed = True

    for subfolder in sorted(paintings_dir.iterdir()):
        if not subfolder.is_dir() or subfolder.name == "mobile":
            continue

        # Get original images
        original_images = sorted([
            p for p in subfolder.glob("*")
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        ])

        # Get mobile images
        mobile_folder = subfolder / "mobile"
        mobile_images = []
        if mobile_folder.exists():
            mobile_images = sorted([
                p for p in mobile_folder.glob("*")
                if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
            ])

        folder_label = f"images/paintings/{subfolder.name}"

        # Validate no gaps in originals
        if original_images:
            orig_numbers = get_image_numbers(original_images)
            if not validate_no_gaps(orig_numbers, f"{folder_label} (original)"):
                all_passed = False

        # Validate sync
        if original_images or mobile_images:
            if not validate_sync(original_images, mobile_images, folder_label):
                all_passed = False

        # Check counts match
        if len(original_images) != len(mobile_images):
            print(f"❌ {folder_label}: Olika antal bilder. Original: {len(original_images)}, Mobile: {len(mobile_images)}")
            all_passed = False

        if all_passed and (original_images or mobile_images):
            print(f"✓ {folder_label}: OK ({len(original_images)} bilder)")

    if all_passed:
        print("\n✅ Alla validerings-kontroller passerade!")
        return 0
    else:
        print("\n❌ Valideringsfel hittades!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
