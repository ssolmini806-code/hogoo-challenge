import os
from PIL import Image

def convert_to_webp(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                source_path = os.path.join(root, file)
                # Skip small icons like threads-icon.png if desired, but here we target all
                # because even small gains add up.
                dest_path = os.path.splitext(source_path)[0] + ".webp"
                
                try:
                    with Image.open(source_path) as img:
                        # Convert to RGB if saving as JPG-like WebP, but WebP supports RGBA
                        img.save(dest_path, "WEBP", quality=80)
                    print(f"Converted: {source_path} -> {dest_path}")
                except Exception as e:
                    print(f"Failed to convert {source_path}: {e}")

if __name__ == "__main__":
    convert_to_webp("public/images")
