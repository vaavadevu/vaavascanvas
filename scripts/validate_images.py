"""
validate_images.py

Validates image structure in paintings folders:
1. No gaps in numbering (01, 02, 03... with no gaps)
2. Desktop and mobile folders have same filenames and count
3. Checks desktop/ and mobile/ folders (original/ is just source files)

Usage:
  python scripts/validate_images.py

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
        print(f"❌ {folder_name}: Gap in numbering. Missing: {sorted(missing)}")
        return False

    return True

def validate_sync(desktop_images: list, mobile_images: list, folder_name: str) -> bool:
    """Check if desktop and mobile folders have same filenames"""
    desktop_names = {img.name for img in desktop_images}
    mobile_names = {img.name for img in mobile_images}

    if desktop_names != mobile_names:
        only_desktop = desktop_names - mobile_names
        only_mobile = mobile_names - desktop_names

        if only_desktop:
            print(f"❌ {folder_name}: Found in desktop but NOT in mobile: {sorted(only_desktop)}")
        if only_mobile:
            print(f"❌ {folder_name}: Found in mobile but NOT in desktop: {sorted(only_mobile)}")

        return False

    return True

def main():
    paintings_dir = ROOT / "images" / "paintings"

    if not paintings_dir.exists():
        print("❌ Folder images/paintings not found")
        return 1

    all_passed = True

    # Find all painting subfolders (those containing desktop/ or mobile/)
    for subfolder in sorted(paintings_dir.iterdir()):
        if not subfolder.is_dir() or subfolder.name in ("original", "desktop", "mobile"):
            continue

        folder_label = f"images/paintings/{subfolder.name}"

        # Get desktop images (compressed for desktop)
        desktop_folder = subfolder / "desktop"
        desktop_images = []
        if desktop_folder.exists():
            desktop_images = sorted([
                p for p in desktop_folder.glob("*")
                if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
            ])

        # Get mobile images (compressed for mobile)
        mobile_folder = subfolder / "mobile"
        mobile_images = []
        if mobile_folder.exists():
            mobile_images = sorted([
                p for p in mobile_folder.glob("*")
                if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
            ])

        # Skip if no compressed images (original/ folder is OK to have just source files)
        if not desktop_images and not mobile_images:
            continue

        # Validate no gaps in desktop
        if desktop_images:
            desktop_numbers = get_image_numbers(desktop_images)
            if not validate_no_gaps(desktop_numbers, f"{folder_label}/desktop"):
                all_passed = False

        # Validate no gaps in mobile
        if mobile_images:
            mobile_numbers = get_image_numbers(mobile_images)
            if not validate_no_gaps(mobile_numbers, f"{folder_label}/mobile"):
                all_passed = False

        # Validate desktop and mobile sync
        if desktop_images or mobile_images:
            if not validate_sync(desktop_images, mobile_images, folder_label):
                all_passed = False

        # Check counts match
        if len(desktop_images) != len(mobile_images):
            print(f"❌ {folder_label}: Different number of images. Desktop: {len(desktop_images)}, Mobile: {len(mobile_images)}")
            all_passed = False

        if all_passed and (desktop_images or mobile_images):
            print(f"✓ {folder_label}: OK ({len(desktop_images)} images)")

    if all_passed:
        print("\n✅ All validation checks passed!")
        return 0
    else:
        print("\n❌ Validation errors found!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
